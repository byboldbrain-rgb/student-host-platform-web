import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const allowedStatuses = ["reviewed", "accepted", "rejected"];

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const rawId = segments[segments.length - 1];
    const id = Number(rawId);

    if (!rawId || Number.isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid request id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status =
      typeof body?.status === "string" ? body.status.trim() : "";

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: existingRequest, error: existingError } = await supabase
      .from("community_join_requests")
      .select("id, status")
      .eq("id", id)
      .single();

    if (existingError || !existingRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    const updatePayload: {
      status: string;
      updated_at: string;
      reviewed_at?: string;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "reviewed") {
      updatePayload.reviewed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("community_join_requests")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("community_join_requests update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully.",
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/community/join-requests/[id] error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}