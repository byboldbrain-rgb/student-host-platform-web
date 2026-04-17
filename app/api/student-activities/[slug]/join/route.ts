import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type RelationItem = {
  id?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
};

function pickRelation(
  relation: RelationItem | RelationItem[] | null | undefined
): RelationItem | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] || null : relation;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { slug } = await context.params;
    const activitySlug = decodeURIComponent(String(slug || "").trim());

    if (!activitySlug) {
      return NextResponse.json(
        { error: "Student activity slug is required" },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from("student_activities")
      .select(
        `
        id,
        slug,
        name_en,
        name_ar,
        logo_url,
        cover_image_url,
        join_button_text_en,
        join_button_text_ar,
        is_active,
        city:cities (
          id,
          name_en,
          name_ar
        ),
        university:universities (
          id,
          name_en,
          name_ar
        )
      `
      )
      .eq("slug", activitySlug)
      .eq("is_active", true)
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

    const city = pickRelation(
      activity.city as RelationItem | RelationItem[] | null
    );
    const university = pickRelation(
      activity.university as RelationItem | RelationItem[] | null
    );

    const { data: form, error: formError } = await supabase
      .from("student_activity_join_forms")
      .select(
        `
        id,
        activity_id,
        title_en,
        title_ar,
        description_en,
        description_ar,
        is_active,
        allow_multiple_submissions,
        created_at,
        updated_at
      `
      )
      .eq("activity_id", activity.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError) {
      return NextResponse.json(
        { error: formError.message },
        { status: 500 }
      );
    }

    let questions: any[] = [];

    if (form) {
      const { data: questionsData, error: questionsError } = await supabase
        .from("student_activity_form_questions")
        .select(
          `
          id,
          form_id,
          question_key,
          label_en,
          label_ar,
          helper_text_en,
          helper_text_ar,
          field_type,
          placeholder_en,
          placeholder_ar,
          is_required,
          is_active,
          sort_order,
          options_json,
          validations_json,
          created_at,
          updated_at
        `
        )
        .eq("form_id", form.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (questionsError) {
        return NextResponse.json(
          { error: questionsError.message },
          { status: 500 }
        );
      }

      questions = questionsData || [];
    }

    return NextResponse.json({
      activity: {
        id: activity.id,
        slug: activity.slug,
        name_en: activity.name_en,
        name_ar: activity.name_ar,
        logo_url: activity.logo_url,
        cover_image_url: activity.cover_image_url,
        join_button_text_en: activity.join_button_text_en,
        join_button_text_ar: activity.join_button_text_ar,
        city_id: city?.id || null,
        city_name_en: city?.name_en || null,
        city_name_ar: city?.name_ar || null,
        university_id: university?.id || null,
        university_name_en: university?.name_en || null,
        university_name_ar: university?.name_ar || null,
      },
      form: form
        ? {
            id: form.id,
            activity_id: form.activity_id,
            title_en: form.title_en,
            title_ar: form.title_ar,
            description_en: form.description_en,
            description_ar: form.description_ar,
            is_active: form.is_active,
            allow_multiple_submissions: form.allow_multiple_submissions,
            created_at: form.created_at,
            updated_at: form.updated_at,
          }
        : null,
      questions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load join page data",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { slug } = await context.params;
    const activitySlug = decodeURIComponent(String(slug || "").trim());

    if (!activitySlug) {
      return NextResponse.json(
        { error: "Student activity slug is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const activityId = String(formData.get("activity_id") || "").trim();
    const formIdValue = formData.get("form_id");
    const formId =
      formIdValue && String(formIdValue).trim() !== ""
        ? Number(formIdValue)
        : null;

    const fullName = String(formData.get("full_name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").trim();

    if (!activityId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from("student_activities")
      .select(
        `
        id,
        slug,
        city_id,
        university_id,
        is_active
      `
      )
      .eq("id", activityId)
      .eq("slug", activitySlug)
      .eq("is_active", true)
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

    let form: any = null;
    let questions: any[] = [];

    if (formId) {
      const { data: formDataRow, error: formError } = await supabase
        .from("student_activity_join_forms")
        .select(
          `
          id,
          activity_id,
          is_active,
          allow_multiple_submissions
        `
        )
        .eq("id", formId)
        .eq("activity_id", activity.id)
        .eq("is_active", true)
        .maybeSingle();

      if (formError) {
        return NextResponse.json(
          { error: formError.message },
          { status: 500 }
        );
      }

      if (!formDataRow) {
        return NextResponse.json(
          { error: "Join form not found" },
          { status: 400 }
        );
      }

      form = formDataRow;

      const { data: questionsData, error: questionsError } = await supabase
        .from("student_activity_form_questions")
        .select(
          `
          id,
          form_id,
          question_key,
          field_type,
          is_required,
          is_active
        `
        )
        .eq("form_id", form.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (questionsError) {
        return NextResponse.json(
          { error: questionsError.message },
          { status: 500 }
        );
      }

      questions = questionsData || [];
    }

    if (form && form.allow_multiple_submissions === false && email) {
      const { data: existingRequest, error: existingError } = await supabase
        .from("student_activity_join_requests")
        .select("id")
        .eq("activity_id", activity.id)
        .eq("form_id", form.id)
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json(
          { error: existingError.message },
          { status: 500 }
        );
      }

      if (existingRequest) {
        return NextResponse.json(
          { error: "You have already submitted a request for this activity" },
          { status: 409 }
        );
      }
    }

    for (const question of questions) {
      const key = `question_${question.id}`;

      if (question.field_type === "checkbox") {
        const values = formData.getAll(key);
        if (question.is_required && values.length === 0) {
          return NextResponse.json(
            { error: `Missing required answer for question ${question.id}` },
            { status: 400 }
          );
        }
      } else {
        const value = String(formData.get(key) || "").trim();
        if (question.is_required && !value) {
          return NextResponse.json(
            { error: `Missing required answer for question ${question.id}` },
            { status: 400 }
          );
        }
      }
    }

    const { data: joinRequest, error: joinRequestError } = await supabase
      .from("student_activity_join_requests")
      .insert({
        activity_id: activity.id,
        form_id: form?.id || null,
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        whatsapp: whatsapp || null,
        city_id: activity.city_id,
        university_id: activity.university_id,
        status: "new",
      })
      .select("id")
      .single();

    if (joinRequestError) {
      return NextResponse.json(
        { error: joinRequestError.message },
        { status: 500 }
      );
    }

    if (questions.length > 0) {
      const answersPayload: Array<{
        join_request_id: number;
        question_id: number;
        answer_text?: string | null;
        answer_json?: any;
      }> = [];

      for (const question of questions) {
        const key = `question_${question.id}`;

        if (question.field_type === "checkbox") {
          const values = formData.getAll(key).map((item) => String(item));
          answersPayload.push({
            join_request_id: joinRequest.id,
            question_id: question.id,
            answer_json: values,
          });
        } else {
          const value = String(formData.get(key) || "").trim();
          answersPayload.push({
            join_request_id: joinRequest.id,
            question_id: question.id,
            answer_text: value || null,
          });
        }
      }

      if (answersPayload.length > 0) {
        const { error: answersError } = await supabase
          .from("student_activity_join_request_answers")
          .insert(answersPayload);

        if (answersError) {
          return NextResponse.json(
            { error: answersError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.redirect(
      new URL(`/services/student-activities/${activity.slug}?joined=1`, request.url),
      { status: 303 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit join request",
      },
      { status: 500 }
    );
  }
}