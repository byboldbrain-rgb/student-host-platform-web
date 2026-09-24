import { NextResponse } from 'next/server';

import { notifyNowOrderAdmins } from '@/src/lib/notifications/admin-push';
import { createAdminClient } from '@/src/lib/supabase/admin';

export const runtime = 'nodejs';

type DatabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
  };
};

const MAX_EVENT_AGE_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DatabaseWebhookPayload;

    if (
      payload.type !== 'INSERT'
      || payload.schema !== 'now'
      || payload.table !== 'orders'
      || !payload.record?.id
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: order, error } = await admin
      .schema('now')
      .from('orders')
      .select(
        'id, order_code, store_name_ar_snapshot, customer_name, total_amount, currency_symbol, created_at',
      )
      .eq('id', payload.record.id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const createdAt = new Date(order.created_at).getTime();
    const eventAge = Date.now() - createdAt;

    if (!Number.isFinite(createdAt) || eventAge < -60_000 || eventAge > MAX_EVENT_AGE_MS) {
      return NextResponse.json({ ok: true, skipped: 'stale_order' });
    }

    const result = await notifyNowOrderAdmins({
      orderId: order.id,
      orderCode: order.order_code,
      storeName: order.store_name_ar_snapshot,
      customerName: order.customer_name,
      totalAmount: order.total_amount,
      currencySymbol: order.currency_symbol,
    });

    return NextResponse.json({ ok: true, sentCount: result.sentCount });
  } catch (error) {
    console.error('Unexpected new order push webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
