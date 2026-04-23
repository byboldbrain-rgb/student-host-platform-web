import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "community-posts";

type AssetType = "image" | "video";

type AssetInput = {
  localId?: string;
  assetType: AssetType;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  existingFileUrl?: string | null;
  existingThumbnailUrl?: string | null;
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

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFileExtension(fileName: string, fallback = "bin") {
  const clean = fileName.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  if (parts.length > 1) return parts.pop() || fallback;
  return fallback;
}

function getMimeFallbackExtension(mimeType: string, assetType: AssetType) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mov")) return "mov";
  return assetType === "video" ? "mp4" : "jpg";
}

async function uploadFileToStorage(params: {
  file: File;
  assetType: AssetType;
  folder: string;
}) {
  const { file, assetType, folder } = params;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const extension =
    getFileExtension(
      file.name,
      getMimeFallbackExtension(file.type || "", assetType)
    ) || getMimeFallbackExtension(file.type || "", assetType);

  const safeName = sanitizeFileName(
    file.name.replace(/\.[^.]+$/, "") || `${assetType}-file`
  );

  const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload file");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
    mimeType: file.type || null,
  };
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
    const formData = await req.formData();
    const rawData = formData.get("data");

    if (typeof rawData !== "string") {
      throw new Error("Invalid form data payload");
    }

    const body = JSON.parse(rawData) as UpdatePostPayload;
    const rawAssets = body.assets || [];

    const assets = rawAssets.map((asset, index) => ({
      localId: asset.localId?.trim() || "",
      assetType: asset.assetType,
      altText: asset.altText?.trim() || null,
      isCover: Boolean(asset.isCover),
      sortOrder:
        typeof asset.sortOrder === "number" ? asset.sortOrder : index,
      existingFileUrl: asset.existingFileUrl?.trim() || "",
      existingThumbnailUrl: asset.existingThumbnailUrl?.trim() || "",
    }));

    const uploadedAssets: Array<{
      post_id: number;
      asset_type: AssetType;
      file_url: string;
      thumbnail_url: string | null;
      alt_text: string | null;
      is_cover: boolean;
      sort_order: number;
      file_mime_type: string | null;
      is_active: true;
    }> = [];

    for (let index = 0; index < assets.length; index++) {
      const asset = assets[index];
      if (!asset.localId) continue;

      const assetFile = formData.get(`assetFiles.${asset.localId}`);
      const assetThumbnail = formData.get(`assetThumbnails.${asset.localId}`);

      let fileUrl = asset.existingFileUrl;
      let thumbnailUrl = asset.existingThumbnailUrl;
      let mimeType: string | null =
        asset.assetType === "video" ? "video/mp4" : "image/*";

      if (assetFile instanceof File && assetFile.size > 0) {
        const uploadedMain = await uploadFileToStorage({
          file: assetFile,
          assetType: asset.assetType,
          folder: `community/posts/main`,
        });

        fileUrl = uploadedMain.publicUrl;
        mimeType = uploadedMain.mimeType;
      }

      if (assetThumbnail instanceof File && assetThumbnail.size > 0) {
        const uploadedThumb = await uploadFileToStorage({
          file: assetThumbnail,
          assetType: "image",
          folder: `community/posts/thumbnails`,
        });

        thumbnailUrl = uploadedThumb.publicUrl;
      }

      if (!fileUrl) continue;

      uploadedAssets.push({
        post_id: 0,
        asset_type: asset.assetType,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl || null,
        alt_text: asset.altText,
        is_cover: asset.isCover,
        sort_order: asset.sortOrder,
        file_mime_type: mimeType,
        is_active: true,
      });
    }

    return {
      body,
      assets: uploadedAssets,
    };
  }

  const body = (await req.json()) as UpdatePostPayload;

  if (!Array.isArray(body.assets)) {
    return {
      body,
      assets: null,
    };
  }

  const assets = body.assets
    .filter((asset) => asset.fileUrl?.trim())
    .map((asset, index) => ({
      post_id: 0,
      asset_type: asset.assetType,
      file_url: asset.fileUrl!.trim(),
      thumbnail_url: asset.thumbnailUrl?.trim() || null,
      alt_text: asset.altText?.trim() || null,
      is_cover: Boolean(asset.isCover),
      sort_order: typeof asset.sortOrder === "number" ? asset.sortOrder : index,
      file_mime_type: asset.assetType === "video" ? "video/mp4" : "image/*",
      is_active: true as const,
    }));

  return {
    body,
    assets,
  };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const postId = Number(id);

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
    const { id } = await context.params;
    const postId = Number(id);

    const { body, assets: parsedAssets } = await parsePatchPayload(req);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.titleEn === "string") {
      const titleEn = body.titleEn.trim();
      if (!titleEn) {
        return NextResponse.json(
          { error: "Title (EN) cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title_en = titleEn;
    }

    if ("titleAr" in body) updateData.title_ar = body.titleAr?.trim() || null;
    if ("excerptEn" in body)
      updateData.excerpt_en = body.excerptEn?.trim() || null;
    if ("excerptAr" in body)
      updateData.excerpt_ar = body.excerptAr?.trim() || null;
    if ("contentEn" in body)
      updateData.content_en = body.contentEn?.trim() || null;
    if ("contentAr" in body)
      updateData.content_ar = body.contentAr?.trim() || null;
    if ("authorName" in body)
      updateData.author_name = body.authorName?.trim() || null;
    if ("publishedAt" in body) updateData.published_at = body.publishedAt || null;
    if ("isFeatured" in body) updateData.is_featured = Boolean(body.isFeatured);
    if ("isPublished" in body) updateData.is_published = Boolean(body.isPublished);
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
          : coverAsset?.thumbnail_url;

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
    const { id } = await context.params;
    const postId = Number(id);

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
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}