import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const [citiesResult, universitiesResult] = await Promise.all([
      supabase
        .from("cities")
        .select("id, name_en, name_ar")
        .order("name_en", { ascending: true }),

      supabase
        .from("universities")
        .select("id, city_id, name_en, name_ar")
        .order("name_en", { ascending: true }),
    ]);

    if (citiesResult.error) {
      return NextResponse.json(
        { error: citiesResult.error.message },
        { status: 500 }
      );
    }

    if (universitiesResult.error) {
      return NextResponse.json(
        { error: universitiesResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      cities: citiesResult.data || [],
      universities: universitiesResult.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load student activities meta data",
      },
      { status: 500 }
    );
  }
}