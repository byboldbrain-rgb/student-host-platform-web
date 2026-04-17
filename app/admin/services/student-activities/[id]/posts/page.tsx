"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Activity = {
  id: string;
  name_en: string;
  name_ar?: string | null;
  slug: string;
};

type PostItem = {
  id: number;
  activity_id: string;
  title_en: string;
  title_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  image_url?: string | null;
  post_type: "activity" | "announcement" | "event" | "news";
  event_date?: string | null;
  is_published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = {
  id: "",
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  image_url: "",
  post_type: "activity",
  event_date: "",
  is_published: true,
  sort_order: 0,
};

export default function StudentActivityPostsPage() {
  const params = useParams();
  const activityId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [activity, setActivity] = useState<Activity | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!activityId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/admin/student-activities/${activityId}/posts`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load posts");
        }

        setActivity(data.activity || null);
        setPosts(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activityId]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "sort_order"
          ? Number(value)
          : value,
    }));
  }

  function startEdit(post: PostItem) {
    setEditingId(post.id);
    setForm({
      id: String(post.id),
      title_en: post.title_en || "",
      title_ar: post.title_ar || "",
      description_en: post.description_en || "",
      description_ar: post.description_ar || "",
      image_url: post.image_url || "",
      post_type: post.post_type || "activity",
      event_date: post.event_date
        ? new Date(post.event_date).toISOString().slice(0, 16)
        : "",
      is_published: Boolean(post.is_published),
      sort_order: Number(post.sort_order || 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(`/api/admin/student-activities/${activityId}/posts`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: editingId ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save post");
      }

      if (editingId) {
        setPosts((prev) =>
          prev.map((item) => (item.id === editingId ? data.item : item))
        );
      } else {
        setPosts((prev) => [data.item, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: number) {
    if (!activityId) {
      setError("Invalid activity id");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      setDeletingId(postId);
      setError("");

      const res = await fetch(
        `/api/admin/student-activities/${activityId}/posts?postId=${postId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete post");
      }

      setPosts((prev) => prev.filter((item) => item.id !== postId));

      if (editingId === postId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  }

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aDate = a.event_date ? new Date(a.event_date).getTime() : 0;
      const bDate = b.event_date ? new Date(b.event_date).getTime() : 0;

      if (aDate !== bDate) return bDate - aDate;
      if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }

      return 0;
    });
  }, [posts]);

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
          <p className="text-sm text-slate-500">Loading posts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Admin / Services / Student Activities / Posts
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Manage Posts
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {activity?.name_en
              ? `Create and manage posts for ${activity.name_en}.`
              : "Create and manage activity posts."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/services/student-activities/${activityId}`}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Activity
          </Link>

          {activity?.slug ? (
            <Link
              href={`/services/student-activities/${activity.slug}`}
              target="_blank"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Public Page
            </Link>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Post" : "Create New Post"}
          </h2>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Title (EN) *
            </label>
            <input
              name="title_en"
              value={form.title_en}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Title (AR) *
            </label>
            <input
              name="title_ar"
              value={form.title_ar}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Post Type
            </label>
            <select
              name="post_type"
              value={form.post_type}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="activity">Activity</option>
              <option value="announcement">Announcement</option>
              <option value="event">Event</option>
              <option value="news">News</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Event Date
            </label>
            <input
              type="datetime-local"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Image URL
            </label>
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
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
            value={form.description_en}
            onChange={handleChange}
            className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description (AR)
          </label>
          <textarea
            name="description_ar"
            value={form.description_ar}
            onChange={handleChange}
            className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
          Published
        </label>

        <div className="border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? editingId
                ? "Saving..."
                : "Creating..."
              : editingId
              ? "Save Changes"
              : "Create Post"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Posts</h2>
            <p className="mt-1 text-sm text-slate-600">
              {sortedPosts.length} post{sortedPosts.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            No posts found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {post.post_type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          post.is_published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.is_published ? "Published" : "Draft"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Sort: {post.sort_order ?? 0}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      {post.title_en}
                    </h3>

                    {post.title_ar ? (
                      <p className="mt-1 text-sm text-slate-500">{post.title_ar}</p>
                    ) : null}

                    {post.description_en ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {post.description_en}
                      </p>
                    ) : null}

                    {post.event_date ? (
                      <p className="mt-3 text-xs text-slate-400">
                        Event date: {new Date(post.event_date).toLocaleString()}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === post.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}