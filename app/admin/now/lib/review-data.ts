import 'server-only';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowAdmin } from './admin-data';
import type { NowAdminRow } from './table-data';

export type ReviewQueueRow = NowAdminRow & {
  signed_url?: string | null;
};

function throwIfError(error: { message?: string; details?: string } | null) {
  if (!error) {
    return;
  }

  throw new Error([error.message, error.details].filter(Boolean).join(' — ') || 'تعذر تحميل مركز المراجعات.');
}

async function attachSignedUrls(rows: NowAdminRow[], admin: ReturnType<typeof createAdminClient>) {
  return Promise.all(
    rows.map(async (row): Promise<ReviewQueueRow> => {
      const bucket = typeof row.storage_bucket === 'string' ? row.storage_bucket : null;
      const path = typeof row.storage_path === 'string' ? row.storage_path : null;

      if (!bucket || !path) {
        return { ...row, signed_url: null };
      }

      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 10);

      return {
        ...row,
        signed_url: error ? null : data?.signedUrl ?? null,
      };
    }),
  );
}

export async function getNowReviewCenterData() {
  const { access } = await requireNowAdmin();
  const admin = createAdminClient();

  let orderPaymentProofs: ReviewQueueRow[] = [];
  let prescriptions: ReviewQueueRow[] = [];
  let ageVerificationOrders: NowAdminRow[] = [];
  let servicePaymentProofs: ReviewQueueRow[] = [];
  let serviceBookings: NowAdminRow[] = [];
  let accountDeletionRequests: NowAdminRow[] = [];

  if (access.permissions.manage_orders) {
    const [
      orderProofResult,
      prescriptionResult,
      ageResult,
      serviceProofResult,
      serviceBookingResult,
    ] = await Promise.all([
      admin
        .schema('now')
        .from('order_payment_proofs')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(25),
      admin
        .schema('now')
        .from('prescription_submissions')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(25),
      admin
        .schema('now')
        .from('orders')
        .select('id, order_code, customer_name, customer_phone, store_name_ar_snapshot, status, age_verified_at, created_at')
        .eq('age_verification_required', true)
        .is('age_verified_at', null)
        .in('status', ['waiting_confirmation', 'confirmed', 'preparing', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(25),
      admin
        .schema('now')
        .from('service_booking_payment_proofs')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(25),
      admin
        .schema('now')
        .from('service_bookings')
        .select('*')
        .in('status', [
          'awaiting-whatsapp-send',
          'waiting-confirmation',
          'confirmed',
          'picked-up',
          'processing',
          'ready-for-delivery',
          'out-for-delivery',
        ])
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    throwIfError(orderProofResult.error);
    throwIfError(prescriptionResult.error);
    throwIfError(ageResult.error);
    throwIfError(serviceProofResult.error);
    throwIfError(serviceBookingResult.error);

    [orderPaymentProofs, prescriptions, servicePaymentProofs] = await Promise.all([
      attachSignedUrls((orderProofResult.data ?? []) as NowAdminRow[], admin),
      attachSignedUrls((prescriptionResult.data ?? []) as NowAdminRow[], admin),
      attachSignedUrls((serviceProofResult.data ?? []) as NowAdminRow[], admin),
    ]);
    ageVerificationOrders = (ageResult.data ?? []) as NowAdminRow[];
    serviceBookings = (serviceBookingResult.data ?? []) as NowAdminRow[];
  }

  if (access.permissions.manage_settings) {
    const deletionResult = await admin
      .schema('now')
      .from('account_deletion_requests')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('requested_at', { ascending: false })
      .limit(25);

    throwIfError(deletionResult.error);
    accountDeletionRequests = (deletionResult.data ?? []) as NowAdminRow[];
  }

  return {
    access,
    orderPaymentProofs,
    prescriptions,
    ageVerificationOrders,
    servicePaymentProofs,
    serviceBookings,
    accountDeletionRequests,
  };
}
