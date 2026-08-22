import 'server-only';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { getAdminOrders, requireNowAdmin } from './admin-data';

async function count(table: string) {
  const admin = createAdminClient();
  const { count: value, error } = await admin
    .schema('now')
    .from(table)
    .select('*', { count: 'exact', head: true });
  return error ? null : value ?? 0;
}

export async function getNowEmployeeDashboardData() {
  const { access } = await requireNowAdmin();
  const admin = createAdminClient();

  const ordersPromise = access.permissions.view_orders
    ? getAdminOrders({ limit: 1, offset: 0 })
    : Promise.resolve(null);

  const reviewCountsPromise = access.permissions.manage_orders
    ? Promise.all([
        admin.schema('now').from('order_payment_proofs').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        admin.schema('now').from('prescription_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        admin.schema('now').from('orders').select('*', { count: 'exact', head: true }).eq('age_verification_required', true).is('age_verified_at', null).in('status', ['waiting_confirmation', 'confirmed', 'preparing', 'out_for_delivery']),
        admin.schema('now').from('service_booking_payment_proofs').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      ]).then((results) => results.reduce((sum, result) => sum + (result.count ?? 0), 0))
    : Promise.resolve(0);

  const deletionCountPromise = access.permissions.manage_settings
    ? admin.schema('now').from('account_deletion_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']).then(({ count: value }) => value ?? 0)
    : Promise.resolve(0);

  const settingsPromise = access.permissions.manage_settings
    ? admin
        .schema('now')
        .from('app_settings')
        .select('orders_enabled,catalog_enabled,maintenance_mode,location_geofencing_enabled')
        .eq('singleton', true)
        .maybeSingle()
        .then(({ data }) => data)
    : Promise.resolve(null);

  const [orders, reviewCount, deletionCount, settings, stores, products, vouchers, serviceBookings] = await Promise.all([
    ordersPromise,
    reviewCountsPromise,
    deletionCountPromise,
    settingsPromise,
    access.permissions.manage_catalog ? count('stores') : Promise.resolve(null),
    access.permissions.manage_catalog ? count('products') : Promise.resolve(null),
    access.permissions.manage_catalog ? count('vouchers') : Promise.resolve(null),
    access.permissions.manage_orders || access.permissions.manage_catalog ? count('service_bookings') : Promise.resolve(null),
  ]);

  return {
    access,
    orders,
    pendingReviews: reviewCount + deletionCount,
    settings,
    counts: { stores, products, vouchers, serviceBookings },
  };
}
