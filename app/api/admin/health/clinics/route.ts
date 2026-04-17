import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();

  const { data: healthCategory, error: categoryError } = await supabase
    .from("service_categories")
    .select("id")
    .eq("slug", "health")
    .single();

  if (categoryError || !healthCategory) {
    return NextResponse.json({ error: "Health category not found" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_providers")
    .select("*")
    .eq("category_id", healthCategory.id)
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

    const { data: healthCategory, error: categoryError } = await supabase
      .from("service_categories")
      .select("id")
      .eq("slug", "health")
      .single();

    if (categoryError || !healthCategory) {
      return NextResponse.json({ error: "Health category not found" }, { status: 400 });
    }

    const payload = {
      category_id: healthCategory.id,
      city_id: body.city_id || null,
      primary_university_id: body.primary_university_id || null,
      name_en: body.name_en,
      name_ar: body.name_ar || null,
      slug: body.slug || null,
      short_description_en: body.short_description_en || null,
      short_description_ar: body.short_description_ar || null,
      full_description_en: body.full_description_en || null,
      full_description_ar: body.full_description_ar || null,
      phone: body.phone || null,
      email: body.email || null,
      whatsapp_number: body.whatsapp_number || null,
      address_line: body.address_line || null,
      google_maps_url: body.google_maps_url || null,
      logo_url: body.logo_url || null,
      cover_image_url: body.cover_image_url || null,
      is_featured: !!body.is_featured,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("service_providers")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}