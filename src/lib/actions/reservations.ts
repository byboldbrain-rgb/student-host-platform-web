'use server'

import { createClient } from '@/src/lib/supabase/server'

export async function getMyPropertyReservationsAction() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  const { data, error } = await supabase
    .from('property_reservations')
    .select(`
      id,
      property_id,
      reservation_scope,
      customer_name,
      total_price_egp,
      wallet_amount_used,
      payment_status,
      start_date,
      end_date,
      status,
      created_at,
      properties (
        id,
        property_id,
        title_en,
        title_ar,
        rental_duration
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}