import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const body = await req.json()
    const isActive = body?.is_active

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be boolean' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('admin_users')
      .update({
        is_active: isActive,
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    )
  }
}