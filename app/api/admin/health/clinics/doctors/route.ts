import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_doctors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const doctorPayload = {
      full_name_en: body.full_name_en,
      full_name_ar: body.full_name_ar || null,
      slug: body.slug || null,
      title_en: body.title_en || null,
      title_ar: body.title_ar || null,
      gender: body.gender || null,
      bio_en: body.bio_en || null,
      bio_ar: body.bio_ar || null,
      photo_url: body.photo_url || null,
      years_of_experience: body.years_of_experience || null,
      consultation_fee: body.consultation_fee || null,
      is_featured: !!body.is_featured,
      is_active: body.is_active ?? true,
    };

    const { data: doctor, error } = await supabase
      .from("health_doctors")
      .insert(doctorPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(doctor, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}