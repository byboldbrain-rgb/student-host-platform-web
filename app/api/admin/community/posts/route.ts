import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyCommunitySubscribers } from "@/src/lib/notifications/community-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AssetType = "image" | "video";

type AssetInput = {
  localId?: string;
  assetType: AssetType;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  altText?: string | null;
  isCover?: boolean;
  sortOrder?: number;
};

type CreatePostPayload = {
  titleEn: string;
  titleAr?: string | null;
  excerptEn?: string | null;
  excerptAr?: string | null;
  contentEn?: string | null;
  contentAr?: string | null;
  postType?: "blog" | "announcement" | "news" | "update";
  isFeatured?: boolean;
  isPublished?: boolean;
  publishedAt?: string | null;
  authorName?: string | null;
  socialMediaLink?: string | null;
  assets?: AssetInput[];
};

const allowedPostTypes = ["blog", "announcement", "news", "update"] as const;
const MAX_ASSETS_PER_POST = 15;

function normalizeAssetType(value: unknown): AssetType | null {
  return value === "image" || value === "video" ? value : null;
}

async function parseCreatePayload(req: Request): Promise<{
  payload: CreatePostPayload;
  uploadedAssets: Array<{
    asset_type: AssetType;
    file_url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
    file_mime_type: string | null;
    is_active: true;
  }>;
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    throw new Error(
      "Multipart upload is disabled. Please upload files directly to storage first."
    );
  }

  const body = (await req.json()) as CreatePostPayload;
  const rawAssets = Array.isArray(body.assets) ? body.assets : [];

  if (rawAssets.length > MAX_ASSETS_PER_POST) {
    throw new Error(`Maximum ${MAX_ASSETS_PER_POST} assets per post`);
  }

  const uploadedAssets = rawAssets
    .filter((asset) => asset.fileUrl?.trim())
    .map((asset, index) => {
      const assetType = normalizeAssetType(asset.assetType);

      if (!assetType) {
        throw new Error("Invalid asset type");
      }

      return {
        asset_type: assetType,
        file_url: asset.fileUrl!.trim(),
        thumbnail_url: asset.thumbnailUrl?.trim() || null,
        alt_text: asset.altText?.trim() || null,
        is_cover: Boolean(asset.isCover),
        sort_order:
          typeof asset.sortOrder === "number" ? asset.sortOrder : index,
        file_mime_type: assetType === "video" ? "video/mp4" : "image/*",
        is_active: true as const,
      };
    });

  return {
    payload: body,
    uploadedAssets,
  };
}

async function getPublishedCommunityPostsCount() {
  const { count, error } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  if (error) {
    console.warn("Failed to count published community posts:", error.message);
    return 0;
  }

  return count || 0;
}

async function notifyNewCommunityPost(params: {
  postId: number;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  isPublished: boolean;
}) {
  if (!params.isPublished) return;

  try {
    const badgeCount = await getPublishedCommunityPostsCount();

    await notifyCommunitySubscribers({
      payload: {
        title: "New Community Post",
        body:
          params.excerpt?.trim() ||
          params.content?.trim() ||
          params.title ||
          "A new post is live in Community.",
        url: "/community",
        tag: `community-post-${params.postId}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        badgeCount,
      },
    });
  } catch (notificationError) {
    console.warn(
      "Community post was created, but push notification failed:",
      notificationError
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List posts error:", error);
      return NextResponse.json(
        { error: "Failed to load posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts: data || [] }, { status: 200 });
  } catch (error) {
    console.error("Admin community posts GET API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { payload: body, uploadedAssets } = await parseCreatePayload(req);

    const titleEn = body.titleEn?.trim();
    const titleAr = body.titleAr?.trim() || null;
    const excerptEn = body.excerptEn?.trim() || null;
    const excerptAr = body.excerptAr?.trim() || null;
    const contentEn = body.contentEn?.trim() || null;
    const contentAr = body.contentAr?.trim() || null;
    const postType = body.postType || "update";
    const isFeatured = Boolean(body.isFeatured);
    const isPublished =
      typeof body.isPublished === "boolean" ? body.isPublished : true;
    const publishedAt = body.publishedAt || null;
    const authorName = body.authorName?.trim() || null;
    const socialMediaLink = body.socialMediaLink?.trim() || null;

    if (!titleEn) {
      return NextResponse.json(
        { error: "Title (EN) is required" },
        { status: 400 }
      );
    }

    if (!allowedPostTypes.includes(postType)) {
      return NextResponse.json(
        { error: "Invalid post type" },
        { status: 400 }
      );
    }

    const assets = uploadedAssets;

    if (assets.length === 0) {
      return NextResponse.json(
        { error: "At least one asset is required" },
        { status: 400 }
      );
    }

    const hasCover = assets.some((asset) => asset.is_cover);
    if (!hasCover) {
      assets[0].is_cover = true;
    }

    const coverAsset =
      assets.find((asset) => asset.is_cover) ?? assets[0] ?? null;

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        title_en: titleEn,
        title_ar: titleAr,
        excerpt_en: excerptEn,
        excerpt_ar: excerptAr,
        content_en: contentEn,
        content_ar: contentAr,
        cover_image_url:
          coverAsset?.asset_type === "image"
            ? coverAsset.file_url
            : coverAsset?.thumbnail_url,
        author_name: authorName,
        post_type: postType,
        is_featured: isFeatured,
        is_published: isPublished,
        published_at: publishedAt,
        social_media_link: socialMediaLink,
      })
      .select("id")
      .single();

    if (postError || !post) {
      console.error("Create post error:", postError);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    const assetsToInsert = assets.map((asset) => ({
      post_id: post.id,
      ...asset,
    }));

    const { error: assetsError } = await supabase
      .from("community_post_assets")
      .insert(assetsToInsert);

    if (assetsError) {
      console.error("Create post assets error:", assetsError);
      return NextResponse.json(
        { error: "Post created but failed to save assets" },
        { status: 500 }
      );
    }

    await notifyNewCommunityPost({
      postId: post.id,
      title: titleEn,
      excerpt: excerptEn,
      content: contentEn,
      isPublished,
    });

    return NextResponse.json(
      {
        success: true,
        postId: post.id,
        message: "Post created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin create community post API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
