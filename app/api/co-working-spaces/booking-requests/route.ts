import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()

  const payload = {
    space_id: String(body?.space_id || '').trim(),
    unit_id: String(body?.unit_id || '').trim() || null,
    customer_name: String(body?.customer_name || '').trim(),
    customer_phone: String(body?.customer_phone || '').trim() || null,
    customer_email: String(body?.customer_email || '').trim() || null,
    customer_whatsapp: String(body?.customer_whatsapp || '').trim() || null,
    booking_date: String(body?.booking_date || '').trim(),
    start_time: String(body?.start_time || '').trim(),
    end_time: String(body?.end_time || '').trim(),
    notes: String(body?.notes || '').trim() || null,
  }

  if (
    !payload.space_id ||
    !payload.customer_name ||
    !payload.booking_date ||
    !payload.start_time ||
    !payload.end_time
  ) {
    return NextResponse.json(
      { error: 'Missing required booking fields' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coworking_booking_requests')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    booking_request_id: data.id,
  })
}