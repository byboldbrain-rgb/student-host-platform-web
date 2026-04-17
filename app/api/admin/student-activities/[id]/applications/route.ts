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

function parseStatus(value: unknown) {
  const status = String(value || "").trim();
  const allowed = ["new", "reviewed", "accepted", "rejected"];
  return allowed.includes(status) ? status : null;
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

    const { data: applications, error: applicationsError } = await supabase
      .from("student_activity_join_requests")
      .select(`
        id,
        activity_id,
        form_id,
        full_name,
        phone,
        email,
        whatsapp,
        city_id,
        university_id,
        notes,
        status,
        reviewed_by_admin_id,
        reviewed_at,
        created_at,
        updated_at
      `)
      .eq("activity_id", activityId)
      .order("created_at", { ascending: false });

    if (applicationsError) {
      return NextResponse.json(
        { error: applicationsError.message },
        { status: 500 }
      );
    }

    const requestIds = (applications || []).map((item) => item.id);

    let answersByRequestId: Record<number, any[]> = {};

    if (requestIds.length > 0) {
      const { data: answers, error: answersError } = await supabase
        .from("student_activity_join_request_answers")
        .select(`
          id,
          join_request_id,
          question_id,
          answer_text,
          answer_json,
          question:student_activity_form_questions (
            id,
            label_en,
            label_ar
          )
        `)
        .in("join_request_id", requestIds);

      if (answersError) {
        return NextResponse.json(
          { error: answersError.message },
          { status: 500 }
        );
      }

      answersByRequestId = (answers || []).reduce(
        (acc: Record<number, any[]>, answer: any) => {
          const requestId = Number(answer.join_request_id);

          if (!acc[requestId]) {
            acc[requestId] = [];
          }

          acc[requestId].push({
            id: answer.id,
            join_request_id: answer.join_request_id,
            question_id: answer.question_id,
            answer_text: answer.answer_text,
            answer_json: answer.answer_json,
            question_label_en: answer.question?.label_en || "Question",
            question_label_ar: answer.question?.label_ar || "",
          });

          return acc;
        },
        {}
      );
    }

    return NextResponse.json({
      activity,
      items: (applications || []).map((item) => ({
        id: item.id,
        activity_id: item.activity_id,
        form_id: item.form_id,
        full_name: item.full_name,
        phone: item.phone,
        email: item.email,
        whatsapp: item.whatsapp,
        city_id: item.city_id,
        university_id: item.university_id,
        notes: item.notes,
        status: item.status,
        reviewed_by_admin_id: item.reviewed_by_admin_id,
        reviewed_at: item.reviewed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        answers: answersByRequestId[item.id] || [],
      })),
      total: (applications || []).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load applications",
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
    const applicationId = Number(body.id);
    const status = parseStatus(body.status);

    if (!applicationId || !Number.isFinite(applicationId)) {
      return NextResponse.json(
        { error: "Valid application id is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Invalid application status" },
        { status: 400 }
      );
    }

    const { data: existingApplication, error: existingApplicationError } =
      await supabase
        .from("student_activity_join_requests")
        .select("id, activity_id")
        .eq("id", applicationId)
        .eq("activity_id", activityId)
        .maybeSingle();

    if (existingApplicationError) {
      return NextResponse.json(
        { error: existingApplicationError.message },
        { status: 500 }
      );
    }

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("student_activity_join_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("activity_id", activityId)
      .select(`
        id,
        activity_id,
        form_id,
        full_name,
        phone,
        email,
        whatsapp,
        city_id,
        university_id,
        notes,
        status,
        reviewed_by_admin_id,
        reviewed_at,
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
          error instanceof Error
            ? error.message
            : "Failed to update application status",
      },
      { status: 500 }
    );
  }
}