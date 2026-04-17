"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type QuestionFormState = {
  id?: number;
  question_key: string;
  label_en: string;
  label_ar: string;
  helper_text_en: string;
  helper_text_ar: string;
  field_type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "select"
    | "radio"
    | "checkbox"
    | "date";
  placeholder_en: string;
  placeholder_ar: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options_text: string;
};

const initialQuestionForm: QuestionFormState = {
  question_key: "",
  label_en: "",
  label_ar: "",
  helper_text_en: "",
  helper_text_ar: "",
  field_type: "text",
  placeholder_en: "",
  placeholder_ar: "",
  is_required: false,
  is_active: true,
  sort_order: 0,
  options_text: "",
};

export default function AdminStudentActivityFormPage() {
  const params = useParams();
  const activityId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [formSettings, setFormSettings] = useState({
    id: "",
    title_en: "Join Form",
    title_ar: "استمارة الانضمام",
    description_en: "",
    description_ar: "",
    is_active: true,
    allow_multiple_submissions: false,
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionForm, setQuestionForm] =
    useState<QuestionFormState>(initialQuestionForm);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activityId) return;
    loadData();
  }, [activityId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/student-activities/${activityId}/form`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load form data");
      }

      setActivity(data.activity || null);

      if (data.form) {
        setFormSettings({
          id: String(data.form.id || ""),
          title_en: data.form.title_en || "Join Form",
          title_ar: data.form.title_ar || "استمارة الانضمام",
          description_en: data.form.description_en || "",
          description_ar: data.form.description_ar || "",
          is_active: Boolean(data.form.is_active),
          allow_multiple_submissions: Boolean(
            data.form.allow_multiple_submissions
          ),
        });
      } else {
        setFormSettings({
          id: "",
          title_en: "Join Form",
          title_ar: "استمارة الانضمام",
          description_en: "",
          description_ar: "",
          is_active: true,
          allow_multiple_submissions: false,
        });
      }

      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form data");
    } finally {
      setLoading(false);
    }
  }

  function handleSettingsChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleQuestionChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setQuestionForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "sort_order"
          ? Number(value)
          : value,
    }));
  }

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    try {
      setSavingSettings(true);
      setError("");

      const res = await fetch(`/api/admin/student-activities/${activityId}/form`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formSettings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save form settings");
      }

      if (data.form) {
        setFormSettings({
          id: String(data.form.id || ""),
          title_en: data.form.title_en || "Join Form",
          title_ar: data.form.title_ar || "استمارة الانضمام",
          description_en: data.form.description_en || "",
          description_ar: data.form.description_ar || "",
          is_active: Boolean(data.form.is_active),
          allow_multiple_submissions: Boolean(
            data.form.allow_multiple_submissions
          ),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save form settings"
      );
    } finally {
      setSavingSettings(false);
    }
  }

  function resetQuestionForm() {
    setQuestionForm(initialQuestionForm);
    setEditingQuestionId(null);
  }

  function buildOptionsText(optionsJson: any) {
    if (!Array.isArray(optionsJson)) return "";
    return optionsJson
      .map((item) => `${item.label_en || item.label || ""}:${item.value || ""}`)
      .join("\n");
  }

  function handleEditQuestion(question: any) {
    setEditingQuestionId(question.id);
    setQuestionForm({
      id: question.id,
      question_key: question.question_key || "",
      label_en: question.label_en || "",
      label_ar: question.label_ar || "",
      helper_text_en: question.helper_text_en || "",
      helper_text_ar: question.helper_text_ar || "",
      field_type: question.field_type || "text",
      placeholder_en: question.placeholder_en || "",
      placeholder_ar: question.placeholder_ar || "",
      is_required: Boolean(question.is_required),
      is_active: Boolean(question.is_active),
      sort_order: Number(question.sort_order || 0),
      options_text: buildOptionsText(question.options_json),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    try {
      setSavingQuestion(true);
      setError("");

      if (!formSettings.id) {
        throw new Error("Save the form settings first");
      }

      const res = await fetch(`/api/admin/student-activities/${activityId}/form`, {
        method: editingQuestionId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_id: Number(formSettings.id),
          id: editingQuestionId,
          ...questionForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save question");
      }

      resetQuestionForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/student-activities/${activityId}/form?questionId=${questionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete question");
      }

      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete question"
      );
    }
  }

  if (!activityId) {
    return (
      <main className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm text-rose-700">Invalid activity id</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading form...</p>
        </div>
      </main>
    );
  }

  const needsOptions = ["select", "radio", "checkbox"].includes(
    questionForm.field_type
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin / Services / Student Activities / Form
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Manage Join Form
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {activity?.name_en
              ? `Configure the join form for ${activity.name_en}.`
              : "Configure the join form and dynamic questions."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/services/student-activities/${activityId}`}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Activity
          </Link>

          <Link
            href={`/admin/services/student-activities/${activityId}/applications`}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Applications
          </Link>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Form Settings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage the public join form title, description, and submission
            behavior.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title (EN)
              </label>
              <input
                name="title_en"
                value={formSettings.title_en}
                onChange={handleSettingsChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title (AR)
              </label>
              <input
                name="title_ar"
                value={formSettings.title_ar}
                onChange={handleSettingsChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description (EN)
            </label>
            <textarea
              name="description_en"
              value={formSettings.description_en}
              onChange={handleSettingsChange}
              className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description (AR)
            </label>
            <textarea
              name="description_ar"
              value={formSettings.description_ar}
              onChange={handleSettingsChange}
              className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={formSettings.is_active}
                onChange={handleSettingsChange}
              />
              Form Active
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="allow_multiple_submissions"
                checked={formSettings.allow_multiple_submissions}
                onChange={handleSettingsChange}
              />
              Allow Multiple Submissions
            </label>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savingSettings ? "Saving..." : "Save Form Settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingQuestionId ? "Edit Question" : "Add New Question"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Create and manage dynamic questions shown in the join form.
            </p>
          </div>

          {editingQuestionId ? (
            <button
              type="button"
              onClick={resetQuestionForm}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSaveQuestion} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Question Key *
              </label>
              <input
                name="question_key"
                value={questionForm.question_key}
                onChange={handleQuestionChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                placeholder="e.g. academic_year"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Field Type *
              </label>
              <select
                name="field_type"
                value={questionForm.field_type}
                onChange={handleQuestionChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="select">Select</option>
                <option value="radio">Radio</option>
                <option value="checkbox">Checkbox</option>
                <option value="date">Date</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Label (EN) *
              </label>
              <input
                name="label_en"
                value={questionForm.label_en}
                onChange={handleQuestionChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Label (AR) *
              </label>
              <input
                name="label_ar"
                value={questionForm.label_ar}
                onChange={handleQuestionChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Placeholder (EN)
              </label>
              <input
                name="placeholder_en"
                value={questionForm.placeholder_en}
                onChange={handleQuestionChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Placeholder (AR)
              </label>
              <input
                name="placeholder_ar"
                value={questionForm.placeholder_ar}
                onChange={handleQuestionChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Helper Text (EN)
            </label>
            <textarea
              name="helper_text_en"
              value={questionForm.helper_text_en}
              onChange={handleQuestionChange}
              className="min-h-[80px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Helper Text (AR)
            </label>
            <textarea
              name="helper_text_ar"
              value={questionForm.helper_text_ar}
              onChange={handleQuestionChange}
              className="min-h-[80px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          {needsOptions ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Options
              </label>
              <textarea
                name="options_text"
                value={questionForm.options_text}
                onChange={handleQuestionChange}
                className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                placeholder={`One option per line\nExample:\nFirst Year:1\nSecond Year:2`}
              />
              <p className="mt-2 text-xs text-slate-500">
                Use one option per line in this format: Label:Value
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sort Order
              </label>
              <input
                name="sort_order"
                type="number"
                value={questionForm.sort_order}
                onChange={handleQuestionChange}
                className="w-40 rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_required"
                checked={questionForm.is_required}
                onChange={handleQuestionChange}
              />
              Required
            </label>

            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={questionForm.is_active}
                onChange={handleQuestionChange}
              />
              Active
            </label>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={savingQuestion}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savingQuestion
                ? editingQuestionId
                  ? "Updating..."
                  : "Creating..."
                : editingQuestionId
                ? "Update Question"
                : "Add Question"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Existing Questions
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">No questions found yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {questions.map((question) => (
              <div
                key={question.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {question.label_en}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {question.field_type}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        question.is_required
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {question.is_required ? "Required" : "Optional"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        question.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {question.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">
                    Key: {question.question_key}
                  </p>

                  <p className="text-sm text-slate-600">
                    {question.label_ar || "-"}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>Sort: {question.sort_order ?? 0}</span>
                    <span>ID: {question.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(question)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}