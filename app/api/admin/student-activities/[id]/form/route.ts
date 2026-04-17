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

function parseOptionsText(optionsText: string) {
  const lines = String(optionsText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [labelPart, ...valueParts] = line.split(":");
    const label = String(labelPart || "").trim();
    const value = String(valueParts.join(":") || label).trim();

    return {
      label_en: label,
      value,
    };
  });
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

function toNullableString(value: unknown) {
  const parsed = String(value || "").trim();
  return parsed || null;
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

    const { data: form, error: formError } = await supabase
      .from("student_activity_join_forms")
      .select(`
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
      `)
      .eq("activity_id", activityId)
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
        .select(`
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
        `)
        .eq("form_id", form.id)
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
      activity,
      form,
      questions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load join form data",
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

    const title_en = String(body.title_en || "Join Form").trim();
    const title_ar = String(body.title_ar || "استمارة الانضمام").trim();
    const description_en = String(body.description_en || "").trim();
    const description_ar = String(body.description_ar || "").trim();
    const is_active = parseBoolean(body.is_active, true);
    const allow_multiple_submissions = parseBoolean(
      body.allow_multiple_submissions,
      false
    );

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

    const { data: existingForm, error: existingFormError } = await supabase
      .from("student_activity_join_forms")
      .select("id")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingFormError) {
      return NextResponse.json(
        { error: existingFormError.message },
        { status: 500 }
      );
    }

    if (existingForm) {
      const { data, error } = await supabase
        .from("student_activity_join_forms")
        .update({
          title_en,
          title_ar,
          description_en: toNullableString(description_en),
          description_ar: toNullableString(description_ar),
          is_active,
          allow_multiple_submissions,
        })
        .eq("id", existingForm.id)
        .select(`
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
        `)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        form: data,
      });
    }

    const { data, error } = await supabase
      .from("student_activity_join_forms")
      .insert({
        activity_id: activityId,
        title_en,
        title_ar,
        description_en: toNullableString(description_en),
        description_ar: toNullableString(description_ar),
        is_active,
        allow_multiple_submissions,
      })
      .select(`
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
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      form: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save join form settings",
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

    const form_id = Number(body.form_id);
    const question_key = String(body.question_key || "").trim();
    const label_en = String(body.label_en || "").trim();
    const label_ar = String(body.label_ar || "").trim();
    const helper_text_en = String(body.helper_text_en || "").trim();
    const helper_text_ar = String(body.helper_text_ar || "").trim();
    const field_type = String(body.field_type || "text").trim();
    const placeholder_en = String(body.placeholder_en || "").trim();
    const placeholder_ar = String(body.placeholder_ar || "").trim();
    const is_required = parseBoolean(body.is_required, false);
    const is_active = parseBoolean(body.is_active, true);
    const sort_order = parseNumber(body.sort_order, 0);
    const options_text = String(body.options_text || "").trim();

    if (!form_id || !question_key || !label_en || !label_ar) {
      return NextResponse.json(
        {
          error: "form_id, question_key, label_en, and label_ar are required",
        },
        { status: 400 }
      );
    }

    const allowedFieldTypes = [
      "text",
      "textarea",
      "number",
      "email",
      "phone",
      "select",
      "radio",
      "checkbox",
      "date",
    ];

    if (!allowedFieldTypes.includes(field_type)) {
      return NextResponse.json(
        { error: "Invalid field_type" },
        { status: 400 }
      );
    }

    const { data: form, error: formError } = await supabase
      .from("student_activity_join_forms")
      .select("id, activity_id")
      .eq("id", form_id)
      .eq("activity_id", activityId)
      .maybeSingle();

    if (formError) {
      return NextResponse.json(
        { error: formError.message },
        { status: 500 }
      );
    }

    if (!form) {
      return NextResponse.json(
        { error: "Join form not found" },
        { status: 404 }
      );
    }

    const { data: existingQuestion, error: existingQuestionError } =
      await supabase
        .from("student_activity_form_questions")
        .select("id")
        .eq("form_id", form_id)
        .eq("question_key", question_key)
        .maybeSingle();

    if (existingQuestionError) {
      return NextResponse.json(
        { error: existingQuestionError.message },
        { status: 500 }
      );
    }

    if (existingQuestion) {
      return NextResponse.json(
        { error: "Question key already exists" },
        { status: 409 }
      );
    }

    const options_json = ["select", "radio", "checkbox"].includes(field_type)
      ? parseOptionsText(options_text)
      : [];

    const { data, error } = await supabase
      .from("student_activity_form_questions")
      .insert({
        form_id,
        question_key,
        label_en,
        label_ar,
        helper_text_en: toNullableString(helper_text_en),
        helper_text_ar: toNullableString(helper_text_ar),
        field_type,
        placeholder_en: toNullableString(placeholder_en),
        placeholder_ar: toNullableString(placeholder_ar),
        is_required,
        is_active,
        sort_order,
        options_json,
      })
      .select(`
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
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
          error instanceof Error
            ? error.message
            : "Failed to create question",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    const questionId = Number(body.id);
    const form_id = Number(body.form_id);
    const question_key = String(body.question_key || "").trim();
    const label_en = String(body.label_en || "").trim();
    const label_ar = String(body.label_ar || "").trim();
    const helper_text_en = String(body.helper_text_en || "").trim();
    const helper_text_ar = String(body.helper_text_ar || "").trim();
    const field_type = String(body.field_type || "text").trim();
    const placeholder_en = String(body.placeholder_en || "").trim();
    const placeholder_ar = String(body.placeholder_ar || "").trim();
    const is_required = parseBoolean(body.is_required, false);
    const is_active = parseBoolean(body.is_active, true);
    const sort_order = parseNumber(body.sort_order, 0);
    const options_text = String(body.options_text || "").trim();

    if (!questionId || !form_id || !question_key || !label_en || !label_ar) {
      return NextResponse.json(
        {
          error:
            "id, form_id, question_key, label_en, and label_ar are required",
        },
        { status: 400 }
      );
    }

    const allowedFieldTypes = [
      "text",
      "textarea",
      "number",
      "email",
      "phone",
      "select",
      "radio",
      "checkbox",
      "date",
    ];

    if (!allowedFieldTypes.includes(field_type)) {
      return NextResponse.json(
        { error: "Invalid field_type" },
        { status: 400 }
      );
    }

    const { data: form, error: formError } = await supabase
      .from("student_activity_join_forms")
      .select("id, activity_id")
      .eq("id", form_id)
      .eq("activity_id", activityId)
      .maybeSingle();

    if (formError) {
      return NextResponse.json(
        { error: formError.message },
        { status: 500 }
      );
    }

    if (!form) {
      return NextResponse.json(
        { error: "Join form not found" },
        { status: 404 }
      );
    }

    const { data: existingQuestion, error: existingQuestionError } =
      await supabase
        .from("student_activity_form_questions")
        .select("id")
        .eq("id", questionId)
        .eq("form_id", form_id)
        .maybeSingle();

    if (existingQuestionError) {
      return NextResponse.json(
        { error: existingQuestionError.message },
        { status: 500 }
      );
    }

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const { data: duplicatedKey, error: duplicatedKeyError } = await supabase
      .from("student_activity_form_questions")
      .select("id")
      .eq("form_id", form_id)
      .eq("question_key", question_key)
      .neq("id", questionId)
      .maybeSingle();

    if (duplicatedKeyError) {
      return NextResponse.json(
        { error: duplicatedKeyError.message },
        { status: 500 }
      );
    }

    if (duplicatedKey) {
      return NextResponse.json(
        { error: "Question key already exists" },
        { status: 409 }
      );
    }

    const options_json = ["select", "radio", "checkbox"].includes(field_type)
      ? parseOptionsText(options_text)
      : [];

    const { data, error } = await supabase
      .from("student_activity_form_questions")
      .update({
        question_key,
        label_en,
        label_ar,
        helper_text_en: toNullableString(helper_text_en),
        helper_text_ar: toNullableString(helper_text_ar),
        field_type,
        placeholder_en: toNullableString(placeholder_en),
        placeholder_ar: toNullableString(placeholder_ar),
        is_required,
        is_active,
        sort_order,
        options_json,
      })
      .eq("id", questionId)
      .eq("form_id", form_id)
      .select(`
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
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
            : "Failed to update question",
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
    const questionId = Number(searchParams.get("questionId"));

    if (!questionId || !Number.isFinite(questionId)) {
      return NextResponse.json(
        { error: "Valid questionId is required" },
        { status: 400 }
      );
    }

    const { data: form, error: formError } = await supabase
      .from("student_activity_join_forms")
      .select("id")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError) {
      return NextResponse.json(
        { error: formError.message },
        { status: 500 }
      );
    }

    if (!form) {
      return NextResponse.json(
        { error: "Join form not found" },
        { status: 404 }
      );
    }

    const { data: existingQuestion, error: existingQuestionError } =
      await supabase
        .from("student_activity_form_questions")
        .select("id")
        .eq("id", questionId)
        .eq("form_id", form.id)
        .maybeSingle();

    if (existingQuestionError) {
      return NextResponse.json(
        { error: existingQuestionError.message },
        { status: 500 }
      );
    }

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("student_activity_form_questions")
      .delete()
      .eq("id", questionId)
      .eq("form_id", form.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete question",
      },
      { status: 500 }
    );
  }
}