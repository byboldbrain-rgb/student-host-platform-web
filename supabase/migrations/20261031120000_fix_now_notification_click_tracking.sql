-- Navienty Now: notification analytics must compare taps and successful receipts
-- for the SAME campaign outbox rows. Server receipt 'ok' confirms provider
-- acceptance, NOT that the notification was viewed on the device.
--
-- This migration records the live Supabase fixes in the dashboard's repo.
-- It also makes notification open acknowledgements idempotent so the mobile
-- app can safely retry events after temporary network/auth failures.

CREATE OR REPLACE VIEW now.notification_delivery_metrics_daily
WITH (security_invoker = true)
AS
WITH ticket_rollup AS (
  SELECT outbox_id,
    count(*) AS ticket_count,
    count(*) FILTER (WHERE status = 'ok') AS receipt_ok_count,
    count(*) FILTER (WHERE status = 'error') AS receipt_error_count
  FROM now.customer_notification_tickets
  GROUP BY outbox_id
),
event_rollup AS (
  SELECT outbox_id,
    count(*) FILTER (WHERE event_type = 'received_foreground') AS foreground_receive_count,
    count(*) FILTER (WHERE event_type = 'conversion') AS conversion_count
  FROM now.customer_notification_events
  GROUP BY outbox_id
)
SELECT
  date_trunc('day', o.created_at) AS day,
  o.notification_category,
  o.channel_id,
  o.campaign_id,
  count(*) AS outbox_count,
  count(*) FILTER (WHERE o.status = 'sent') AS processed_count,
  count(*) FILTER (WHERE o.status = 'failed') AS failed_count,
  count(*) FILTER (WHERE o.delivery_disposition = 'ticketed') AS ticketed_outbox_count,
  count(*) FILTER (WHERE o.delivery_disposition = 'skipped_no_subscription') AS skipped_no_subscription_count,
  count(*) FILTER (WHERE o.delivery_disposition = 'skipped_preference') AS skipped_preference_count,
  coalesce(sum(tr.ticket_count), 0)::bigint AS provider_ticket_count,
  coalesce(sum(tr.receipt_ok_count), 0)::bigint AS receipt_ok_count,
  coalesce(sum(tr.receipt_error_count), 0)::bigint AS receipt_error_count,
  count(*) FILTER (
    WHERE o.first_opened_at IS NOT NULL
      AND coalesce(tr.receipt_ok_count, 0) > 0
  ) AS opened_outbox_count,
  coalesce(sum(er.foreground_receive_count), 0)::bigint AS foreground_receive_count,
  CASE
    WHEN count(*) FILTER (WHERE coalesce(tr.receipt_ok_count, 0) > 0) = 0
      THEN 0::numeric
    ELSE round(
      100.0 * count(*) FILTER (
        WHERE o.first_opened_at IS NOT NULL
          AND coalesce(tr.receipt_ok_count, 0) > 0
      )::numeric
      / count(*) FILTER (WHERE coalesce(tr.receipt_ok_count, 0) > 0)::numeric,
      2
    )
  END AS open_rate_pct,
  coalesce(sum(er.conversion_count), 0)::bigint AS conversion_count,
  CASE
    WHEN count(*) FILTER (
      WHERE o.first_opened_at IS NOT NULL
        AND coalesce(tr.receipt_ok_count, 0) > 0
    ) = 0 THEN 0::numeric
    ELSE round(
      100.0 * count(*) FILTER (
        WHERE o.first_converted_at IS NOT NULL
          AND coalesce(tr.receipt_ok_count, 0) > 0
      )::numeric
      / count(*) FILTER (
        WHERE o.first_opened_at IS NOT NULL
          AND coalesce(tr.receipt_ok_count, 0) > 0
      )::numeric,
      2
    )
  END AS conversion_rate_from_open_pct
FROM now.customer_notification_outbox o
LEFT JOIN ticket_rollup tr ON tr.outbox_id = o.id
LEFT JOIN event_rollup er ON er.outbox_id = o.id
GROUP BY date_trunc('day', o.created_at), o.notification_category, o.channel_id, o.campaign_id;

CREATE OR REPLACE FUNCTION now.track_my_notification_event(
  p_outbox_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_row now.customer_notification_outbox%rowtype;
  v_event_type text := lower(btrim(coalesce(p_event_type, '')));
  v_inserted integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING errcode='42501', message='authentication_required';
  END IF;
  IF v_event_type NOT IN ('received_foreground', 'opened') THEN
    RAISE EXCEPTION USING errcode='22023', message='invalid_client_notification_event';
  END IF;

  SELECT * INTO v_row
  FROM now.customer_notification_outbox o
  WHERE o.id = p_outbox_id AND o.user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO now.customer_notification_events (
    outbox_id, user_id, event_type, source, channel_id,
    notification_category, campaign_id, metadata, dedupe_key
  ) VALUES (
    v_row.id, v_user_id, v_event_type, 'client', v_row.channel_id,
    v_row.notification_category, v_row.campaign_id,
    coalesce(p_metadata, '{}'::jsonb),
    v_row.id::text || ':' || v_user_id::text || ':' || v_event_type
  )
  ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_event_type = 'opened' THEN
    UPDATE now.customer_notification_outbox
    SET first_opened_at = coalesce(first_opened_at, now()),
        updated_at = now()
    WHERE id = v_row.id;
  END IF;

  -- A retry of an already recorded event is a successful acknowledgement.
  RETURN v_inserted = 1 OR EXISTS (
    SELECT 1
    FROM now.customer_notification_events e
    WHERE e.outbox_id = v_row.id
      AND e.user_id = v_user_id
      AND e.event_type = v_event_type
  );
END;
$function$;
