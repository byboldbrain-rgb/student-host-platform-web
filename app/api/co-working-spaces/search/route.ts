import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const cityId = searchParams.get('city')
  const universityId = searchParams.get('university')

  if (!cityId || !universityId) {
    return NextResponse.json(
      { error: 'city and university are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_coworking_spaces_for_university', {
    p_city_id: cityId,
    p_university_id: universityId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}