import { NextRequest, NextResponse } from "next/server";
import { searchAllTrips } from "@/src/lib/transportation/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date") || undefined;
  const type = (searchParams.get("type") || "all") as "all" | "train" | "bus";

  if (!from || !to) {
    return NextResponse.json(
      { error: '"from" and "to" are required' },
      { status: 400 }
    );
  }

  const trips = await searchAllTrips({ from, to, date, type });

  return NextResponse.json(trips);
}