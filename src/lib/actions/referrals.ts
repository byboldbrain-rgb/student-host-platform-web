"use server";

import { revalidatePath } from "next/cache";
import {
  applyReferralCodeForCurrentUser,
  getMyReferralInfo,
  validateReferralCode,
} from "@/src/lib/services/referral-service";

export async function getMyReferralInfoAction() {
  return await getMyReferralInfo();
}

export async function validateReferralCodeAction(code: string) {
  try {
    const data = await validateReferralCode(code);
    return { success: true, ...data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذر التحقق من كود الإحالة";
    return { success: false, error: message };
  }
}

export async function applyReferralCodeAction(formData: FormData) {
  const code = String(formData.get("referral_code") ?? "").trim();

  if (!code) {
    return { success: false, error: "ادخل كود الإحالة" };
  }

  try {
    const data = await applyReferralCodeForCurrentUser(code);

    revalidatePath("/account");
    revalidatePath("/account/referrals");
    revalidatePath("/signup");

    return {
      success: true,
      data,
      message: "تم ربط كود الإحالة بحسابك بنجاح",
    };
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "تعذر تطبيق كود الإحالة";

    const mappedMessage =
      rawMessage === "REFERRAL_ALREADY_USED"
        ? "تم استخدام كود إحالة مسبقًا لهذا الحساب"
        : rawMessage === "INVALID_REFERRAL_CODE"
        ? "كود الإحالة غير صحيح"
        : rawMessage === "SELF_REFERRAL_NOT_ALLOWED"
        ? "لا يمكن استخدام كود الإحالة الخاص بك"
        : rawMessage;

    return { success: false, error: mappedMessage };
  }
}