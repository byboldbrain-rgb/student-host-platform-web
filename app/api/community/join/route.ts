import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type JoinPayload = {
  formId?: number | null;
  fullName: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  cityId?: string | null;
  universityId?: string | null;
  desiredRole?:
    | "pr_communications"
    | "photographer"
    | "videographer"
    | "video_editor"
    | "social_media"
    | "content_creator"
    | "graphic_designer"
    | "hr"
    | "";
};

const allowedRoles = [
  "pr_communications",
  "photographer",
  "videographer",
  "video_editor",
  "social_media",
  "content_creator",
  "graphic_designer",
  "hr",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JoinPayload;

    const formId = body.formId ?? null;
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const whatsapp = body.whatsapp?.trim() || null;
    const cityId = body.cityId?.trim() || null;
    const universityId = body.universityId?.trim() || null;
    const desiredRole = body.desiredRole?.trim() || null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!cityId) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    if (!universityId) {
      return NextResponse.json(
        { error: "University is required" },
        { status: 400 }
      );
    }

    if (!desiredRole || !allowedRoles.includes(desiredRole)) {
      return NextResponse.json(
        { error: "Invalid desired role" },
        { status: 400 }
      );
    }

    if (formId) {
      const { data: form, error: formError } = await supabase
        .from("community_join_forms")
        .select("id")
        .eq("id", formId)
        .eq("is_active", true)
        .single();

      if (formError || !form) {
        return NextResponse.json(
          { error: "Invalid or inactive form" },
          { status: 400 }
        );
      }
    }

    const { data: city, error: cityError } = await supabase
      .from("cities")
      .select("id, name_en, name_ar")
      .eq("id", cityId)
      .single();

    if (cityError || !city) {
      return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    }

    const { data: university, error: universityError } = await supabase
      .from("universities")
      .select("id, city_id, name_en, name_ar")
      .eq("id", universityId)
      .single();

    if (universityError || !university) {
      return NextResponse.json(
        { error: "Invalid university" },
        { status: 400 }
      );
    }

    if (university.city_id !== city.id) {
      return NextResponse.json(
        { error: "Selected university does not belong to the selected city" },
        { status: 400 }
      );
    }

    const cityText = city.name_en?.trim() || city.name_ar?.trim() || null;
    const universityText =
      university.name_en?.trim() || university.name_ar?.trim() || null;

    const { error: insertError } = await supabase
      .from("community_join_requests")
      .insert({
        form_id: formId,
        full_name: fullName,
        phone,
        email,
        whatsapp,
        city_text: cityText,
        university_text: universityText,
        desired_role: desiredRole,
        status: "new",
      });

    if (insertError) {
      console.error("Community join insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save join request" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Join request submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Community join API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}