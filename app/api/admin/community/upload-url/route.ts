import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "community-posts";

type AssetType = "image" | "video";
type UploadPurpose = "main" | "thumbnail";

const MAX_IMAGE_SIZE_MB = 8;
const MAX_VIDEO_SIZE_MB = 80;
const MAX_THUMBNAIL_SIZE_MB = 5;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

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
  if (mimeType.includes("quicktime") || mimeType.includes("mov")) return "mov";
  return assetType === "video" ? "mp4" : "jpg";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fileName = String(body.fileName || "");
    const fileType = String(body.fileType || "");
    const fileSize = Number(body.fileSize || 0);
    const assetType = body.assetType as AssetType;
    const purpose = body.purpose as UploadPurpose;

    if (!fileName || !fileType || !fileSize || !assetType || !purpose) {
      return NextResponse.json(
        { error: "Missing upload data" },
        { status: 400 }
      );
    }

    if (!["image", "video"].includes(assetType)) {
      return NextResponse.json(
        { error: "Invalid asset type" },
        { status: 400 }
      );
    }

    if (!["main", "thumbnail"].includes(purpose)) {
      return NextResponse.json(
        { error: "Invalid upload purpose" },
        { status: 400 }
      );
    }

    const isThumbnail = purpose === "thumbnail";

    const allowedTypes =
      assetType === "video" && !isThumbnail
        ? ALLOWED_VIDEO_TYPES
        : ALLOWED_IMAGE_TYPES;

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}` },
        { status: 400 }
      );
    }

    const maxMb = isThumbnail
      ? MAX_THUMBNAIL_SIZE_MB
      : assetType === "video"
        ? MAX_VIDEO_SIZE_MB
        : MAX_IMAGE_SIZE_MB;

    if (fileSize > maxMb * 1024 * 1024) {
      return NextResponse.json(
        { error: `File must be less than ${maxMb}MB` },
        { status: 400 }
      );
    }

    const extension = getFileExtension(
      fileName,
      getMimeFallbackExtension(fileType, assetType)
    );

    const safeName = sanitizeFileName(
      fileName.replace(/\.[^.]+$/, "") || `${assetType}-file`
    );

    const folder =
      purpose === "thumbnail"
        ? "community/posts/thumbnails"
        : "community/posts/main";

    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const publicUrlData = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json(
      {
        path: filePath,
        token: data.token,
        signedUrl: data.signedUrl,
        publicUrl: publicUrlData.data.publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create signed upload URL error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
