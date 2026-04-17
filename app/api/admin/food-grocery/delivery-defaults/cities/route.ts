import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCurrentAdminContext, isFoodSuperAdmin } from '@/src/lib/admin-auth'

type CreateCityInput = {
  name_en?: string | null
  name_ar?: string | null
}

function canManageDeliveryDefaults(role: string) {
  return (
    role === 'food_super_admin' ||
    role === 'food_editor' ||
    role === 'food_adder'
  )
}

export async function POST(req: Request) {
  try {
    const adminContext = await getCurrentAdminContext()

    if (!adminContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminContext.admin

    if (!isFoodSuperAdmin(admin) && !canManageDeliveryDefaults(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as CreateCityInput

    const nameEn = body?.name_en?.trim() || null
    const nameAr = body?.name_ar?.trim() || null

    if (!nameEn && !nameAr) {
      return NextResponse.json(
        { error: 'City must have at least an English or Arabic name' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const payload = {
      name_en: nameEn || nameAr || 'Unnamed City',
      name_ar: nameAr || nameEn || 'مدينة بدون اسم',
    }

    const { data, error } = await supabase
      .from('cities')
      .insert(payload)
      .select('id, name_en, name_ar')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'City created successfully',
      city: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}