import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const cityId = req.nextUrl.searchParams.get("cityId")?.trim();

    if (!cityId) {
      return NextResponse.json(
        { error: "cityId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("universities")
      .select("id, city_id, name_en, name_ar")
      .eq("city_id", cityId)
      .order("name_en", { ascending: true });

    if (error) {
      console.error("Universities fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch universities" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (error) {
    console.error("Universities API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}