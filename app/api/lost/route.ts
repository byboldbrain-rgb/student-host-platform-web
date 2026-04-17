import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const governorate = searchParams.get("governorate");
  const university = searchParams.get("university");
  const status = searchParams.get("status") || "available";

  let query = supabase
    .from("lost_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (governorate) query = query.eq("governorate", governorate);
  if (university) query = query.eq("university", university);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = [
      "governorate",
      "university",
      "title",
      "holder_name",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Field "${field}" is required.` },
          { status: 400 }
        );
      }
    }

    const payload = {
      governorate: body.governorate,
      university: body.university,
      faculty: body.faculty || null,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      image_url: body.image_url || null,
      found_location: body.found_location || null,
      found_date: body.found_date || null,
      holder_name: body.holder_name,
      holder_phone: body.holder_phone || null,
      holder_email: body.holder_email || null,
      status: "available",
    };

    const { data, error } = await supabase
      .from("lost_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}