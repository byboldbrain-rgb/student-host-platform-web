"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Image as ImageIcon,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  Video,
  FileText,
  LayoutList,
  ArrowLeft,
} from "lucide-react";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";

type AssetType = "image" | "video";

type CommunityPostRow = {
  id: number;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  post_type: "blog" | "announcement" | "news" | "update";
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  social_media_link: string | null;
};

type CommunityPostAssetRow = {
  id: number;
  post_id: number;
  asset_type: AssetType;
  file_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

type PostAssetInput = {
  localId: string;
  assetType: AssetType;
  altText: string;
  isCover: boolean;
  sortOrder: number;

  file: File | null;
  thumbnailFile: File | null;

  previewUrl: string;
  thumbnailPreviewUrl: string;

  existingFileUrl: string;
  existingThumbnailUrl: string;
};

type PostForm = {
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
  postType: "announcement" | "news" | "update" | "blog";
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
  authorName: string;
  socialMediaLink: string;
  assets: PostAssetInput[];
};

const primaryButtonClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa]";

const inputClass =
  "h-14 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const textareaClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-[#222222] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none";

function createEmptyAsset(isCover = false, sortOrder = 0): PostAssetInput {
  return {
    localId: crypto.randomUUID(),
    assetType: "image",
    altText: "",
    isCover,
    sortOrder,
    file: null,
    thumbnailFile: null,
    previewUrl: "",
    thumbnailPreviewUrl: "",
    existingFileUrl: "",
    existingThumbnailUrl: "",
  };
}

const emptyForm = (): PostForm => ({
  titleEn: "",
  titleAr: "",
  excerptEn: "",
  excerptAr: "",
  contentEn: "",
  contentAr: "",
  postType: "update",
  isFeatured: false,
  isPublished: true,
  publishedAt: "",
  authorName: "Navienty Team",
  socialMediaLink: "",
  assets: [createEmptyAsset(true, 0)],
});

function BrandLogo() {
  return (
    <Link href="/admin" className="navienty-logo" aria-label="Navienty admin home">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  );
}

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string;
  label: string;
  isPrimary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200",
        isPrimary
          ? "border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
          : "border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState<CommunityPostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [form, setForm] = useState<PostForm>(emptyForm());
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExistingPosts, setShowExistingPosts] = useState(false);

  const [tableMessage, setTableMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const coverAsset = useMemo(
    () => form.assets.find((asset) => asset.isCover) ?? form.assets[0],
    [form.assets]
  );

  const coverAssetMediaUrl =
    coverAsset?.previewUrl || coverAsset?.existingFileUrl || "";

  const coverAssetPosterUrl =
    coverAsset?.thumbnailPreviewUrl || coverAsset?.existingThumbnailUrl || "";

  useEffect(() => {
    return () => {
      form.assets.forEach((asset) => {
        if (asset.file && asset.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(asset.previewUrl);
        }
        if (
          asset.thumbnailFile &&
          asset.thumbnailPreviewUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(asset.thumbnailPreviewUrl);
        }
      });
    };
  }, [form.assets]);

  async function loadPosts() {
    try {
      setLoadingPosts(true);
      const res = await fetch("/api/admin/community/posts", {
        cache: "no-store",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load posts");
      }

      setPosts(result.posts || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load posts"
      );
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function cleanupAssets(assets: PostAssetInput[]) {
    assets.forEach((asset) => {
      if (asset.file && asset.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(asset.previewUrl);
      }
      if (
        asset.thumbnailFile &&
        asset.thumbnailPreviewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(asset.thumbnailPreviewUrl);
      }
    });
  }

  function resetForm() {
    cleanupAssets(form.assets);
    setForm(emptyForm());
    setEditingPostId(null);
    setFormMessage("");
    setErrorMessage("");
  }

  function updateAsset(localId: string, patch: Partial<PostAssetInput>) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) =>
        asset.localId === localId ? { ...asset, ...patch } : asset
      ),
    }));
  }

  function addAsset() {
    setForm((prev) => ({
      ...prev,
      assets: [...prev.assets, createEmptyAsset(false, prev.assets.length)],
    }));
  }

  function removeAsset(localId: string) {
    setForm((prev) => {
      const assetToRemove = prev.assets.find((asset) => asset.localId === localId);

      if (assetToRemove) {
        if (assetToRemove.file && assetToRemove.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(assetToRemove.previewUrl);
        }
        if (
          assetToRemove.thumbnailFile &&
          assetToRemove.thumbnailPreviewUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(assetToRemove.thumbnailPreviewUrl);
        }
      }

      const filtered = prev.assets.filter((asset) => asset.localId !== localId);

      if (filtered.length === 0) {
        return {
          ...prev,
          assets: [createEmptyAsset(true, 0)],
        };
      }

      const hasCover = filtered.some((asset) => asset.isCover);

      return {
        ...prev,
        assets: filtered.map((asset, index) => ({
          ...asset,
          sortOrder: index,
          isCover: hasCover ? asset.isCover : index === 0,
        })),
      };
    });
  }

  function setCoverAsset(localId: string) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => ({
        ...asset,
        isCover: asset.localId === localId,
      })),
    }));
  }

  function handleAssetFileChange(
    localId: string,
    file: File | null,
    assetType: AssetType
  ) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        if (asset.localId !== localId) return asset;

        if (asset.file && asset.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(asset.previewUrl);
        }

        if (!file) {
          return {
            ...asset,
            file: null,
            previewUrl: asset.existingFileUrl || "",
            assetType,
          };
        }

        const previewUrl = URL.createObjectURL(file);

        return {
          ...asset,
          file,
          previewUrl,
          assetType,
          existingFileUrl: asset.existingFileUrl || "",
        };
      }),
    }));
  }

  function handleThumbnailFileChange(localId: string, file: File | null) {
    setForm((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        if (asset.localId !== localId) return asset;

        if (
          asset.thumbnailFile &&
          asset.thumbnailPreviewUrl.startsWith("blob:")
        ) {
          URL.revokeObjectURL(asset.thumbnailPreviewUrl);
        }

        if (!file) {
          return {
            ...asset,
            thumbnailFile: null,
            thumbnailPreviewUrl: asset.existingThumbnailUrl || "",
          };
        }

        return {
          ...asset,
          thumbnailFile: file,
          thumbnailPreviewUrl: URL.createObjectURL(file),
        };
      }),
    }));
  }

  async function startEdit(postId: number) {
    try {
      setErrorMessage("");
      const res = await fetch(`/api/admin/community/posts/${postId}`, {
        cache: "no-store",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load post");
      }

      const post: CommunityPostRow = result.post;
      const assets: CommunityPostAssetRow[] = result.assets || [];

      cleanupAssets(form.assets);

      setEditingPostId(post.id);
      setForm({
        titleEn: post.title_en || "",
        titleAr: post.title_ar || "",
        excerptEn: post.excerpt_en || "",
        excerptAr: post.excerpt_ar || "",
        contentEn: post.content_en || "",
        contentAr: post.content_ar || "",
        postType: post.post_type || "update",
        isFeatured: post.is_featured,
        isPublished: post.is_published,
        publishedAt: post.published_at
          ? new Date(post.published_at).toISOString().slice(0, 16)
          : "",
        authorName: post.author_name || "Navienty Team",
        socialMediaLink: post.social_media_link || "",
        assets:
          assets.length > 0
            ? assets
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((asset, index) => ({
                  localId: `asset-${asset.id}-${index}`,
                  assetType: asset.asset_type,
                  altText: asset.alt_text || "",
                  isCover: asset.is_cover,
                  sortOrder: asset.sort_order,
                  file: null,
                  thumbnailFile: null,
                  previewUrl: asset.file_url || "",
                  thumbnailPreviewUrl: asset.thumbnail_url || "",
                  existingFileUrl: asset.file_url || "",
                  existingThumbnailUrl: asset.thumbnail_url || "",
                }))
            : [createEmptyAsset(true, 0)],
      });

      setShowExistingPosts(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load post"
      );
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormMessage("");
    setErrorMessage("");

    try {
      const validAssets = form.assets.filter(
        (asset) => asset.file || asset.existingFileUrl
      );

      const postData = {
        titleEn: form.titleEn.trim(),
        titleAr: form.titleAr.trim() || null,
        excerptEn: form.excerptEn.trim() || null,
        excerptAr: form.excerptAr.trim() || null,
        contentEn: form.contentEn.trim() || null,
        contentAr: form.contentAr.trim() || null,
        postType: form.postType || "update",
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        publishedAt: form.publishedAt || null,
        authorName: form.authorName.trim() || null,
        socialMediaLink: form.socialMediaLink.trim() || null,
        assets: validAssets.map((asset, index) => ({
          localId: asset.localId,
          assetType: asset.assetType,
          altText: asset.altText.trim() || null,
          isCover: asset.isCover,
          sortOrder: index,
          existingFileUrl: asset.file ? null : asset.existingFileUrl || null,
          existingThumbnailUrl: asset.thumbnailFile
            ? null
            : asset.existingThumbnailUrl || null,
        })),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(postData));

      validAssets.forEach((asset) => {
        if (asset.file) {
          formData.append(`assetFiles.${asset.localId}`, asset.file);
        }

        if (asset.thumbnailFile) {
          formData.append(
            `assetThumbnails.${asset.localId}`,
            asset.thumbnailFile
          );
        }
      });

      const isEdit = editingPostId !== null;
      const url = isEdit
        ? `/api/admin/community/posts/${editingPostId}`
        : "/api/admin/community/posts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save post");
      }

      setFormMessage(
        isEdit ? "Post updated successfully." : "Post created successfully."
      );
      resetForm();
      await loadPosts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save post"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmed) return;

    try {
      setTableMessage("");
      setErrorMessage("");

      const res = await fetch(`/api/admin/community/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete post");
      }

      setTableMessage("Post deleted successfully.");
      if (editingPostId === postId) resetForm();
      await loadPosts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete post"
      );
    }
  }

  async function quickUpdate(
    postId: number,
    patch: { isPublished?: boolean; isFeatured?: boolean }
  ) {
    try {
      setTableMessage("");
      setErrorMessage("");

      const res = await fetch(`/api/admin/community/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update post");
      }

      setTableMessage("Post updated successfully.");
      await loadPosts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update post"
      );
    }
  }

  return (
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#fbfbfb] pb-28 text-gray-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/community/posts"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Community Posts
              </Link>

              <Link
                href="/admin/community/join-requests"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Join Requests
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          {tableMessage ? (
            <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {tableMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8"
            >
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <FileText className="h-3.5 w-3.5" />
                    {editingPostId ? `Editing #${editingPostId}` : "New Post"}
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#222222]">
                    {editingPostId ? "Edit post details" : "Create a new post"}
                  </h2>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Title (EN) *
                  </label>
                  <input
                    type="text"
                    value={form.titleEn}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, titleEn: e.target.value }))
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Content (EN)
                  </label>
                  <textarea
                    rows={6}
                    value={form.contentEn}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, contentEn: e.target.value }))
                    }
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#222222]">
                    Social Media Link
                  </label>
                  <input
                    type="url"
                    value={form.socialMediaLink}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        socialMediaLink: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="https://www.instagram.com/p/..."
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      Author
                    </label>
                    <input
                      type="text"
                      value={form.authorName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, authorName: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      Published At
                    </label>
                    <input
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, publishedAt: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#222222]">
                      Featured
                    </label>
                    <label className="flex min-h-[56px] items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            isFeatured: e.target.checked,
                          }))
                        }
                      />
                      Featured
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-[#222222]">
                      Post assets
                    </h3>
                    <p className="mt-1 text-sm text-[#667085]">
                      Upload images or videos and choose which one appears as the
                      cover.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addAsset}
                    className={primaryButtonClass}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </button>
                </div>

                <div className="grid gap-4">
                  {form.assets.map((asset, index) => {
                    const assetMediaUrl = asset.previewUrl || asset.existingFileUrl;
                    const assetThumbUrl =
                      asset.thumbnailPreviewUrl || asset.existingThumbnailUrl;

                    return (
                      <div
                        key={asset.localId}
                        className="rounded-[28px] border border-black/[0.06] bg-[#fafcff] p-5"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-base font-semibold text-[#222222]">
                              Asset #{index + 1}
                            </p>
                            <p className="mt-1 text-sm text-[#667085]">
                              Configure media and cover state.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAsset(asset.localId)}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-rose-300 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-[#222222]">
                              Asset Type
                            </label>
                            <select
                              value={asset.assetType}
                              onChange={(e) =>
                                updateAsset(asset.localId, {
                                  assetType: e.target.value as AssetType,
                                  thumbnailFile:
                                    e.target.value === "image"
                                      ? null
                                      : asset.thumbnailFile,
                                  thumbnailPreviewUrl:
                                    e.target.value === "image"
                                      ? ""
                                      : asset.thumbnailPreviewUrl,
                                  existingThumbnailUrl:
                                    e.target.value === "image"
                                      ? ""
                                      : asset.existingThumbnailUrl,
                                })
                              }
                              className={inputClass}
                            >
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-[#222222]">
                              Upload {asset.assetType === "image" ? "Image" : "Video"}
                            </label>

                            <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] transition hover:border-blue-500 hover:bg-blue-50/40">
                              <Upload className="h-4 w-4 text-blue-600" />
                              <span className="truncate">
                                {asset.file
                                  ? asset.file.name
                                  : assetMediaUrl
                                    ? "Current file selected"
                                    : `Choose ${asset.assetType} from device`}
                              </span>
                              <input
                                type="file"
                                accept={
                                  asset.assetType === "image"
                                    ? "image/*"
                                    : "video/*"
                                }
                                capture={
                                  asset.assetType === "image"
                                    ? "environment"
                                    : undefined
                                }
                                onChange={(e) =>
                                  handleAssetFileChange(
                                    asset.localId,
                                    e.target.files?.[0] || null,
                                    asset.assetType
                                  )
                                }
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-[#222222]">
                              Cover
                            </label>
                            <button
                              type="button"
                              onClick={() => setCoverAsset(asset.localId)}
                              className={`inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                asset.isCover
                                  ? "border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
                                  : "border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:-translate-y-[1px] hover:border-gray-300 hover:bg-[#fafafa]"
                              }`}
                            >
                              {asset.isCover ? "Cover Asset" : "Set as Cover"}
                            </button>
                          </div>
                        </div>

                        {asset.assetType === "video" ? (
                          <div className="mt-4">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-[#222222]">
                                Video Thumbnail
                              </label>

                              <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-[#222222] transition hover:border-blue-500 hover:bg-blue-50/40">
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                                <span className="truncate">
                                  {asset.thumbnailFile
                                    ? asset.thumbnailFile.name
                                    : assetThumbUrl
                                      ? "Current thumbnail selected"
                                      : "Choose thumbnail (optional)"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) =>
                                    handleThumbnailFileChange(
                                      asset.localId,
                                      e.target.files?.[0] || null
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : null}

                        {assetMediaUrl ? (
                          <div className="mt-4 overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#f8fafc]">
                            {asset.assetType === "video" ? (
                              <video
                                controls
                                poster={assetThumbUrl || undefined}
                                className="h-[240px] w-full bg-black object-cover"
                              >
                                <source src={assetMediaUrl} />
                              </video>
                            ) : (
                              <img
                                src={assetMediaUrl}
                                alt={asset.altText || `Asset ${index + 1}`}
                                className="h-[240px] w-full object-cover"
                              />
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {formMessage ? (
                <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {formMessage}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={saving} className={primaryButtonClass}>
                  {saving
                    ? "Saving..."
                    : editingPostId
                      ? "Update Post"
                      : "Create Post"}
                </button>

                {editingPostId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={secondaryButtonClass}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowExistingPosts((prev) => !prev)}
                className={primaryButtonClass + " w-full"}
              >
                {showExistingPosts ? (
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Live Preview
                  </>
                ) : (
                  <>
                    <LayoutList className="mr-2 h-4 w-4" />
                    Existing Posts
                  </>
                )}
              </button>

              {!showExistingPosts ? (
                <div className="rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold tracking-tight text-[#222222]">
                      Live Preview
                    </h2>
                  </div>

                  <article className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-[#fcfdff]">
                    {coverAssetMediaUrl ? (
                      <div className="bg-black">
                        {coverAsset?.assetType === "video" ? (
                          <video
                            controls
                            poster={coverAssetPosterUrl || undefined}
                            className="h-[320px] w-full object-cover"
                          >
                            <source src={coverAssetMediaUrl} />
                          </video>
                        ) : (
                          <img
                            src={coverAssetMediaUrl}
                            alt={coverAsset.altText || form.titleEn || "Cover"}
                            className="h-[320px] w-full object-cover"
                          />
                        )}
                      </div>
                    ) : null}

                    <div className="p-5">
                      <h3 className="text-2xl font-semibold tracking-tight text-[#222222]">
                        {form.titleEn || "Post title preview"}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#667085]">
                        {form.contentEn || "Post content preview"}
                      </p>

                      {form.socialMediaLink ? (
                        <a
                          href={form.socialMediaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block text-sm font-semibold text-blue-600 underline underline-offset-4"
                        >
                          Open social media post
                        </a>
                      ) : null}

                      <div className="mt-5 grid gap-3">
                        {form.assets.map((asset) => {
                          const assetName =
                            asset.file?.name ||
                            asset.existingFileUrl.split("/").pop() ||
                            "No file selected";

                          return (
                            <div
                              key={asset.localId}
                              className="flex items-center gap-3 rounded-2xl border border-black/[0.04] bg-[#f7f9fc] px-4 py-3"
                            >
                              {asset.assetType === "image" ? (
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Video className="h-4 w-4 text-blue-600" />
                              )}
                              <span className="truncate text-sm text-[#222222]">
                                {assetName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                </div>
              ) : (
                <div className="rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-tight text-[#222222]">
                      Existing Posts
                    </h2>
                    <span className="rounded-full border border-gray-200 bg-[#fafafa] px-3 py-1 text-xs font-semibold text-[#475467]">
                      {posts.length} posts
                    </span>
                  </div>

                  <div className="space-y-4">
                    {loadingPosts ? (
                      <p className="text-sm text-[#667085]">Loading posts...</p>
                    ) : posts.length === 0 ? (
                      <p className="text-sm text-[#667085]">No posts found.</p>
                    ) : (
                      posts.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-[28px] border border-black/[0.06] bg-[#fafcff] p-4"
                        >
                          <div className="flex items-start gap-4">
                            {post.cover_image_url ? (
                              <img
                                src={post.cover_image_url}
                                alt={post.title_en}
                                className="h-20 w-20 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#eef2f6] text-xs text-[#667085]">
                                No Media
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-semibold text-[#222222]">
                                  {post.title_en}
                                </h3>

                                {post.is_featured ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                    <Star className="h-3 w-3" />
                                    Featured
                                  </span>
                                ) : null}

                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                    post.is_published
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {post.is_published ? "Published" : "Draft"}
                                </span>
                              </div>

                              <p className="mt-2 line-clamp-2 text-sm text-[#667085]">
                                {post.excerpt_en || "No excerpt"}
                              </p>

                              {post.social_media_link ? (
                                <a
                                  href={post.social_media_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block break-all text-xs font-semibold text-blue-600 underline underline-offset-4"
                                >
                                  {post.social_media_link}
                                </a>
                              ) : (
                                <p className="mt-2 text-xs text-[#98a2b3]">
                                  No social media link
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(post.id)}
                                  className={secondaryButtonClass}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    quickUpdate(post.id, {
                                      isPublished: !post.is_published,
                                    })
                                  }
                                  className={secondaryButtonClass}
                                >
                                  {post.is_published ? "Unpublish" : "Publish"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    quickUpdate(post.id, {
                                      isFeatured: !post.is_featured,
                                    })
                                  }
                                  className={secondaryButtonClass}
                                >
                                  {post.is_featured ? "Unfeature" : "Feature"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(post.id)}
                                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-rose-300 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-2 gap-2">
            <MobileBottomNavItem
              href="/admin/community/posts"
              label="Posts"
              isPrimary
            />
            <MobileBottomNavItem
              href="/admin/community/join-requests"
              label="Join Requests"
            />
          </div>
        </nav>
      </main>
    </>
  );
}