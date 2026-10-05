'use server';

import { revalidatePath } from 'next/cache';

import { cairoToday, requireFinanceAdmin } from './lib/finance-data';

function text(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function nullable(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function amount(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : 0;
}

export async function addExpenseAction(formData: FormData) {
  const description = text(formData, 'description');
  const expenseAmount = amount(formData, 'amount');
  const paymentAccountId = text(formData, 'payment_account_id');

  if (!description || expenseAmount <= 0) {
    throw new Error('وصف المصروف والمبلغ مطلوبان.');
  }
  if (!paymentAccountId) {
    throw new Error('اختار الحساب اللي اتدفع منه المصروف.');
  }

  const { admin, access } = await requireFinanceAdmin();
  const { data: expenseId, error } = await admin.schema('now').rpc('create_finance_expense_with_payment', {
    p_expense_date: text(formData, 'expense_date') || cairoToday(),
    p_category: text(formData, 'category') || 'other',
    p_cost_center: text(formData, 'cost_center') || 'operations',
    p_vendor: nullable(formData, 'vendor'),
    p_description: description,
    p_amount: expenseAmount,
    p_payment_account_id: paymentAccountId,
    p_receipt_url: nullable(formData, 'receipt_url'),
    p_related_order_id: nullable(formData, 'related_order_id'),
    p_related_trip_id: nullable(formData, 'related_trip_id'),
    p_related_employee_id: nullable(formData, 'related_employee_id'),
    p_notes: nullable(formData, 'notes'),
    p_created_by: access.user_id,
  });

  if (error) {
    if (error.message.toLowerCase().includes('insufficient book balance')) {
      throw new Error('رصيد الحساب غير كافي لتسجيل المصروف. راجع رصيد الحساب أو اختار حساب تاني.');
    }
    throw new Error(error.message);
  }

  const id = String(expenseId ?? '');
  if (!id) throw new Error('تعذر إنشاء المصروف.');

  const { data: expense, error: readError } = await admin
    .schema('now')
    .from('finance_expenses')
    .select('*')
    .eq('id', id)
    .single();
  if (readError) throw new Error(readError.message);

  await admin.schema('now').from('finance_audit_log').insert({
    entity_type: 'expense',
    entity_id: id,
    action: 'create_with_payment',
    old_data: null,
    new_data: expense,
    actor_user_id: access.user_id,
  });

  for (const path of [
    '/admin/now/finance',
    '/admin/now/finance/expenses',
    '/admin/now/finance/cash',
    '/admin/now/finance/reports',
  ]) {
    revalidatePath(path);
  }
}
