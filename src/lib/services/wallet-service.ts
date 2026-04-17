import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

export type WalletDirection = "credit" | "debit";
export type WalletTransactionType =
  | "signup_bonus"
  | "referral_bonus"
  | "deposit_approved"
  | "manual_adjustment"
  | "booking_payment"
  | "rent_auto_deduction"
  | "refund"
  | "discount_applied";

export type WalletDepositMethod =
  | "instapay"
  | "vodafone_cash"
  | "orange_cash"
  | "etisalat_cash"
  | "bank_transfer";

export async function getMyWallet() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("user_wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getMyWalletTransactions(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

export async function getMyDepositRequests(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("wallet_deposit_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

export async function getActiveWalletPaymentMethods() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wallet_payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function createWalletDepositRequest(input: {
  amount: number;
  paymentMethod: WalletDepositMethod;
  receiptImageUrl: string;
  senderName?: string | null;
  senderPhone?: string | null;
  transactionReference?: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("UNAUTHORIZED");

  if (!input.amount || input.amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  if (!input.receiptImageUrl?.trim()) {
    throw new Error("RECEIPT_IMAGE_REQUIRED");
  }

  const payload = {
    user_id: user.id,
    amount: input.amount,
    payment_method: input.paymentMethod,
    receipt_image_url: input.receiptImageUrl.trim(),
    sender_name: input.senderName?.trim() || null,
    sender_phone: input.senderPhone?.trim() || null,
    transaction_reference: input.transactionReference?.trim() || null,
  };

  const { data, error } = await supabase
    .from("wallet_deposit_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function approveDepositRequestByAdmin(input: {
  depositRequestId: string;
  adminUserId: string;
  reviewNotes?: string | null;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("approve_wallet_deposit_request", {
    p_deposit_request_id: input.depositRequestId,
    p_admin_user_id: input.adminUserId,
    p_review_notes: input.reviewNotes ?? null,
  });

  if (error) throw error;

  return data;
}

export async function rejectDepositRequestByAdmin(input: {
  depositRequestId: string;
  adminUserId: string;
  reviewNotes?: string | null;
}) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("reject_wallet_deposit_request", {
    p_deposit_request_id: input.depositRequestId,
    p_admin_user_id: input.adminUserId,
    p_review_notes: input.reviewNotes ?? null,
  });

  if (error) throw error;

  return true;
}

export async function applyWalletTransactionByAdmin(input: {
  userId: string;
  direction: WalletDirection;
  transactionType: WalletTransactionType;
  amount: number;
  referenceTable?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  createdByAdminId?: string | null;
}) {
  if (!input.amount || input.amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const admin = createAdminClient();

  const { data, error } = await admin.rpc("apply_wallet_transaction", {
    p_user_id: input.userId,
    p_direction: input.direction,
    p_type: input.transactionType,
    p_amount: input.amount,
    p_reference_table: input.referenceTable ?? null,
    p_reference_id: input.referenceId ?? null,
    p_notes: input.notes ?? null,
    p_created_by_admin_id: input.createdByAdminId ?? null,
  });

  if (error) throw error;

  return data;
}