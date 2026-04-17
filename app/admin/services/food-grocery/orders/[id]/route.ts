import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import {
  getCurrentAdminContext,
  isFoodSuperAdmin,
} from '@/src/lib/admin-auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminContext = await getCurrentAdminContext()

    if (!adminContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminContext.admin

    const canHandleOrders =
      isFoodSuperAdmin(admin) || admin.role === 'food_receiver'

    if (!canHandleOrders) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = await params
    const nextStatus = body?.status

    if (nextStatus !== 'accepted' && nextStatus !== 'cancelled') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('restaurant_orders')
      .update({
        status: nextStatus,
        handled_by_admin_id: admin.id,
        handled_at: new Date().toISOString(),
      })
      .eq('id', Number(id))
      .eq('status', 'pending')
      .select('id, status')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Order already handled by another employee' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      order: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}