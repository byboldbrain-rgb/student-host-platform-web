import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeDateTime(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function toNullableString(value: unknown) {
  const parsed = String(value || "").trim();
  return parsed || null;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return fallback;
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from("student_activities")
      .select("id, name_en, name_ar, slug")
      .eq("id", activityId)
      .maybeSingle();

    if (activityError) {
      return NextResponse.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    if (!activity) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    const { data: posts, error: postsError } = await supabase
      .from("student_activity_posts")
      .select(`
        id,
        activity_id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        image_url,
        post_type,
        event_date,
        is_published,
        sort_order,
        created_at,
        updated_at
      `)
      .eq("activity_id", activityId)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (postsError) {
      return NextResponse.json(
        { error: postsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activity,
      items: posts || [],
      total: (posts || []).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load student activity posts",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const title_en = String(body.title_en || "").trim();
    const title_ar = String(body.title_ar || "").trim();
    const description_en = String(body.description_en || "").trim();
    const description_ar = String(body.description_ar || "").trim();
    const image_url = String(body.image_url || "").trim();
    const post_type = String(body.post_type || "activity").trim();
    const event_date = normalizeDateTime(body.event_date || "");
    const is_published = parseBoolean(body.is_published, true);
    const sort_order = parseNumber(body.sort_order, 0);

    if (!title_en || !title_ar) {
      return NextResponse.json(
        { error: "title_en and title_ar are required" },
        { status: 400 }
      );
    }

    const allowedPostTypes = ["activity", "announcement", "event", "news"];
    if (!allowedPostTypes.includes(post_type)) {
      return NextResponse.json(
        { error: "Invalid post_type" },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from("student_activities")
      .select("id")
      .eq("id", activityId)
      .maybeSingle();

    if (activityError) {
      return NextResponse.json(
        { error: activityError.message },
        { status: 500 }
      );
    }

    if (!activity) {
      return NextResponse.json(
        { error: "Student activity not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("student_activity_posts")
      .insert({
        activity_id: activityId,
        title_en,
        title_ar,
        description_en: toNullableString(description_en),
        description_ar: toNullableString(description_ar),
        image_url: toNullableString(image_url),
        post_type,
        event_date,
        is_published,
        sort_order,
      })
      .select(`
        id,
        activity_id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        image_url,
        post_type,
        event_date,
        is_published,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        item: data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const postId = Number(body.id);

    if (!postId || !Number.isFinite(postId)) {
      return NextResponse.json(
        { error: "Valid post id is required" },
        { status: 400 }
      );
    }

    const title_en = String(body.title_en || "").trim();
    const title_ar = String(body.title_ar || "").trim();
    const description_en = String(body.description_en || "").trim();
    const description_ar = String(body.description_ar || "").trim();
    const image_url = String(body.image_url || "").trim();
    const post_type = String(body.post_type || "activity").trim();
    const event_date = normalizeDateTime(body.event_date || "");
    const is_published = parseBoolean(body.is_published, true);
    const sort_order = parseNumber(body.sort_order, 0);

    if (!title_en || !title_ar) {
      return NextResponse.json(
        { error: "title_en and title_ar are required" },
        { status: 400 }
      );
    }

    const allowedPostTypes = ["activity", "announcement", "event", "news"];
    if (!allowedPostTypes.includes(post_type)) {
      return NextResponse.json(
        { error: "Invalid post_type" },
        { status: 400 }
      );
    }

    const { data: existingPost, error: existingPostError } = await supabase
      .from("student_activity_posts")
      .select("id, activity_id")
      .eq("id", postId)
      .eq("activity_id", activityId)
      .maybeSingle();

    if (existingPostError) {
      return NextResponse.json(
        { error: existingPostError.message },
        { status: 500 }
      );
    }

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("student_activity_posts")
      .update({
        title_en,
        title_ar,
        description_en: toNullableString(description_en),
        description_ar: toNullableString(description_ar),
        image_url: toNullableString(image_url),
        post_type,
        event_date,
        is_published,
        sort_order,
      })
      .eq("id", postId)
      .eq("activity_id", activityId)
      .select(`
        id,
        activity_id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        image_url,
        post_type,
        event_date,
        is_published,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update post",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activityId = String(id || "").trim();

    if (!activityId || !isValidUuid(activityId)) {
      return NextResponse.json(
        { error: "Invalid student activity id" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = Number(searchParams.get("postId"));

    if (!postId || !Number.isFinite(postId)) {
      return NextResponse.json(
        { error: "Valid postId is required" },
        { status: 400 }
      );
    }

    const { data: existingPost, error: existingPostError } = await supabase
      .from("student_activity_posts")
      .select("id, activity_id")
      .eq("id", postId)
      .eq("activity_id", activityId)
      .maybeSingle();

    if (existingPostError) {
      return NextResponse.json(
        { error: existingPostError.message },
        { status: 500 }
      );
    }

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("student_activity_posts")
      .delete()
      .eq("id", postId)
      .eq("activity_id", activityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete post",
      },
      { status: 500 }
    );
  }
}