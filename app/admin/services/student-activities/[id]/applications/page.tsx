"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminStudentActivityApplicationsPage() {
  const params = useParams();
  const activityId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activityId) return;
    loadData();
  }, [activityId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/admin/student-activities/${activityId}/applications`,
        {
          cache: "no-store",
        }
      );

      const rawText = await res.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error("Applications API did not return valid JSON");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load applications");
      }

      setActivity(data.activity || null);
      setApplications(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId: number, status: string) {
    try {
      setError("");

      const res = await fetch(
        `/api/admin/student-activities/${activityId}/applications`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: applicationId,
            status,
          }),
        }
      );

      const rawText = await res.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error("Applications API did not return valid JSON");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
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
          <p className="text-sm text-slate-500">Loading applications...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin / Services / Student Activities / Applications
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Applications
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {activity?.name_en
              ? `View and manage applications for ${activity.name_en}.`
              : "View submitted join requests."}
          </p>
        </div>

        <Link
          href={`/admin/services/student-activities/${activityId}`}
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to Activity
        </Link>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            All Applications
          </h2>
        </div>

        {applications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No applications submitted yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {applications.map((app) => (
              <div key={app.id} className="space-y-4 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {app.full_name || "Unnamed"}
                    </h3>
                    <p className="text-sm text-slate-500">{app.email || "-"}</p>
                  </div>

                  <select
                    value={app.status}
                    onChange={(e) =>
                      handleStatusChange(app.id, e.target.value)
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="text-sm text-slate-600">
                    <p>
                      <strong>Phone:</strong> {app.phone || "-"}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong> {app.whatsapp || "-"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>
                      <strong>Date:</strong>{" "}
                      {app.created_at
                        ? new Date(app.created_at).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>

                {app.answers?.length > 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-800">
                      Answers
                    </h4>

                    <div className="space-y-2 text-sm text-slate-700">
                      {app.answers.map((ans: any) => (
                        <div key={ans.id}>
                          <strong>{ans.question_label_en}:</strong>{" "}
                          {ans.answer_text || JSON.stringify(ans.answer_json)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}