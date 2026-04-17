"use server";

import { redirect } from "next/navigation";
import { createAdminDoctor } from "@/src/lib/services/health/admin";
import { createClient } from "@supabase/supabase-js";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNullableNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "jpg" : "jpg";
}

async function uploadDoctorPhoto(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Invalid image file");
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are missing");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const extension = getFileExtension(file.name);
  const fileName = `doctor-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = `doctors/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("doctor-photos")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload doctor photo");
  }

  const { data } = supabase.storage.from("doctor-photos").getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Failed to generate photo URL");
  }

  return data.publicUrl;
}

export async function createDoctorAction(formData: FormData) {
  const photoFile = formData.get("photo");
  let photo_url: string | null = null;

  if (photoFile instanceof File && photoFile.size > 0) {
    photo_url = await uploadDoctorPhoto(photoFile);
  }

  await createAdminDoctor({
    full_name_en: getString(formData, "full_name_en"),
    photo_url,
    consultation_fee: getNullableNumber(formData, "consultation_fee"),

    phone: getNullableString(formData, "phone"),
    whatsapp_number: getNullableString(formData, "whatsapp_number"),

    city_id: getNullableString(formData, "city_id"),
    specialty_subcategory_id: getNullableNumber(
      formData,
      "specialty_subcategory_id",
    ),

    clinic_address_line: getNullableString(formData, "clinic_address_line"),
  });

  redirect("/admin/services/health/doctors");
}