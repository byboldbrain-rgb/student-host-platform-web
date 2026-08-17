-- Prevent valid Meta webhook events from being dropped by the message type check.
-- Applied to production on 2026-08-17 via migration
-- `allow_whatsapp_reaction_and_unsupported_message_types`.

alter table public.whatsapp_messages
  drop constraint if exists whatsapp_messages_message_type_check;

alter table public.whatsapp_messages
  add constraint whatsapp_messages_message_type_check
  check (
    message_type = any (
      array[
        'text','image','video','audio','document','sticker','location','contacts',
        'button','interactive','template','reaction','unsupported','unknown'
      ]::text[]
    )
  );
