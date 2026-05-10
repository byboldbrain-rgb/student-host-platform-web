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

type UpdatePostPayload = {
  titleEn?: string;
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
const MAX_ASSETS_PER_POST = 5;

function parsePostId(rawId: string | undefined) {
  if (!rawId) return null;

  const postId = Number(rawId);

  if (!Number.isInteger(postId) || postId <= 0) {
    return null;
  }

  return postId;
}

function normalizeAssetType(value: unknown): AssetType | null {
  return value === "image" || value === "video" ? value : null;
}

async function parsePatchPayload(req: Request): Promise<{
  body: UpdatePostPayload;
  assets: Array<{
    post_id: number;
    asset_type: AssetType;
    file_url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
    file_mime_type: string | null;
    is_active: true;
  }> | null;
}> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    throw new Error(
      "Multipart upload is disabled. Please upload files directly to storage first."
    );
  }

  const body = (await req.json()) as UpdatePostPayload;

  if (!Array.isArray(body.assets)) {
    return {
      body,
      assets: null,
    };
  }

  if (body.assets.length > MAX_ASSETS_PER_POST) {
    throw new Error(`Maximum ${MAX_ASSETS_PER_POST} assets per post`);
  }

  const assets = body.assets
    .filter((asset) => asset.fileUrl?.trim())
    .map((asset, index) => {
      const assetType = normalizeAssetType(asset.assetType);

      if (!assetType) {
        throw new Error("Invalid asset type");
      }

      return {
        post_id: 0,
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
    body,
    assets,
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

async function notifyPublishedCommunityPost(params: {
  postId: number;
  title: string;
  excerpt?: string | null;
  content?: string | null;
}) {
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
      "Community post was published, but push notification failed:",
      notificationError
    );
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawPostId } = await context.params;
    const postId = parsePostId(rawPostId);

    if (!postId) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { data: assets, error: assetsError } = await supabase
      .from("community_post_assets")
      .select("*")
      .eq("post_id", postId)
      .order("sort_order", { ascending: true });

    if (assetsError) {
      console.error("Load post assets error:", assetsError);
      return NextResponse.json(
        { error: "Failed to load post assets" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        post,
        assets: assets || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin post GET by id API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawPostId } = await context.params;
    const postId = parsePostId(rawPostId);

    if (!postId) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const { data: existingPost, error: existingPostError } = await supabase
      .from("community_posts")
      .select("id, title_en, excerpt_en, content_en, is_published")
      .eq("id", postId)
      .maybeSingle();

    if (existingPostError) {
      console.error("Load existing post error:", existingPostError);
      return NextResponse.json(
        { error: "Failed to load existing post" },
        { status: 500 }
      );
    }

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const wasPublished = Boolean(existingPost.is_published);

    const { body, assets: parsedAssets } = await parsePatchPayload(req);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    let nextTitle = existingPost.title_en || "Community post";
    let nextExcerpt = existingPost.excerpt_en || null;
    let nextContent = existingPost.content_en || null;

    if (typeof body.titleEn === "string") {
      const titleEn = body.titleEn.trim();

      if (!titleEn) {
        return NextResponse.json(
          { error: "Title (EN) cannot be empty" },
          { status: 400 }
        );
      }

      updateData.title_en = titleEn;
      nextTitle = titleEn;
    }

    if ("titleAr" in body) {
      updateData.title_ar = body.titleAr?.trim() || null;
    }

    if ("excerptEn" in body) {
      updateData.excerpt_en = body.excerptEn?.trim() || null;
      nextExcerpt = body.excerptEn?.trim() || null;
    }

    if ("excerptAr" in body) {
      updateData.excerpt_ar = body.excerptAr?.trim() || null;
    }

    if ("contentEn" in body) {
      updateData.content_en = body.contentEn?.trim() || null;
      nextContent = body.contentEn?.trim() || null;
    }

    if ("contentAr" in body) {
      updateData.content_ar = body.contentAr?.trim() || null;
    }

    if ("authorName" in body) {
      updateData.author_name = body.authorName?.trim() || null;
    }

    if ("publishedAt" in body) {
      updateData.published_at = body.publishedAt || null;
    }

    if ("isFeatured" in body) {
      updateData.is_featured = Boolean(body.isFeatured);
    }

    if ("isPublished" in body) {
      updateData.is_published = Boolean(body.isPublished);
    }

    if ("socialMediaLink" in body) {
      updateData.social_media_link = body.socialMediaLink?.trim() || null;
    }

    if ("postType" in body) {
      if (!body.postType || !allowedPostTypes.includes(body.postType)) {
        return NextResponse.json(
          { error: "Invalid post type" },
          { status: 400 }
        );
      }

      updateData.post_type = body.postType;
    }

    if (Array.isArray(parsedAssets)) {
      const assets = parsedAssets.map((asset) => ({
        ...asset,
        post_id: postId,
      }));

      if (assets.length === 0) {
        return NextResponse.json(
          { error: "At least one asset is required" },
          { status: 400 }
        );
      }

      const hasCover = assets.some((asset) => asset.is_cover);
      if (!hasCover) assets[0].is_cover = true;

      const coverAsset =
        assets.find((asset) => asset.is_cover) ?? assets[0] ?? null;

      updateData.cover_image_url =
        coverAsset?.asset_type === "image"
          ? coverAsset.file_url
          : coverAsset?.thumbnail_url || null;

      const { error: deleteAssetsError } = await supabase
        .from("community_post_assets")
        .delete()
        .eq("post_id", postId);

      if (deleteAssetsError) {
        console.error("Delete old assets error:", deleteAssetsError);
        return NextResponse.json(
          { error: "Failed to update post assets" },
          { status: 500 }
        );
      }

      const { error: insertAssetsError } = await supabase
        .from("community_post_assets")
        .insert(assets);

      if (insertAssetsError) {
        console.error("Insert new assets error:", insertAssetsError);
        return NextResponse.json(
          { error: "Failed to update post assets" },
          { status: 500 }
        );
      }
    }

    const { error } = await supabase
      .from("community_posts")
      .update(updateData)
      .eq("id", postId);

    if (error) {
      console.error("Update post error:", error);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    const isNowPublished =
      "isPublished" in body ? Boolean(body.isPublished) : wasPublished;

    const shouldNotify = !wasPublished && isNowPublished;

    if (shouldNotify) {
      await notifyPublishedCommunityPost({
        postId,
        title: nextTitle,
        excerpt: nextExcerpt,
        content: nextContent,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin post PATCH API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawPostId } = await context.params;
    const postId = parsePostId(rawPostId);

    if (!postId) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const { data: existingPost, error: existingPostError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .maybeSingle();

    if (existingPostError) {
      console.error("Load post before delete error:", existingPostError);
      return NextResponse.json(
        { error: "Failed to load post" },
        { status: 500 }
      );
    }

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const relatedTables = [
      "community_post_assets",
      "community_post_comments",
      "community_post_likes",
      "community_post_shares",
    ];

    for (const table of relatedTables) {
      const { error: relatedDeleteError } = await supabase
        .from(table)
        .delete()
        .eq("post_id", postId);

      if (relatedDeleteError) {
        console.error(`Delete related ${table} error:`, relatedDeleteError);
        return NextResponse.json(
          { error: `Failed to delete related ${table}` },
          { status: 500 }
        );
      }
    }

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Delete post error:", error);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin post DELETE API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}