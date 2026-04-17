import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

const ALLOWED_STATUSES = [
  'new',
  'sent_to_provider',
  'accepted',
  'completed',
  'cancelled',
] as const

function isAllowedStatus(value: string): value is (typeof ALLOWED_STATUSES)[number] {
  return ALLOWED_STATUSES.includes(value as (typeof ALLOWED_STATUSES)[number])
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const orderId = Number(params.id)

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const body = await req.json()
    const status = typeof body?.status === 'string' ? body.status.trim() : ''
    const notes =
      body?.notes === null || body?.notes === undefined
        ? null
        : String(body.notes).trim() || null

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!isAllowedStatus(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatePayload: {
      status: string
      notes: string | null
      updated_at: string
      handled_at?: string
      handled_by_admin_id?: string
    } = {
      status,
      notes,
      updated_at: new Date().toISOString(),
    }

    if (status !== 'new') {
      updatePayload.handled_at = new Date().toISOString()
      updatePayload.handled_by_admin_id = user.id
    }

    const { error } = await supabase
      .from('service_orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}