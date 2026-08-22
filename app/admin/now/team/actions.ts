'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { requireNowTableAccess } from '../lib/table-data';

const roles = ['operations', 'customer_support', 'catalog_manager', 'finance', 'viewer'] as const;

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

function go(kind: 'success' | 'error', message: string): never {
  redirect(`/admin/now/team?${kind}=${encodeURIComponent(message)}`);
}

function errorMessage(error: { message?: string; details?: string; hint?: string } | null) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ') || 'تعذر حفظ التغيير.';
}

function permissions(formData: FormData) {
  const canManageOrders = checked(formData, 'can_manage_orders');
  return {
    can_view_orders: checked(formData, 'can_view_orders') || canManageOrders,
    can_manage_orders: canManageOrders,
    can_manage_catalog: checked(formData, 'can_manage_catalog'),
    can_manage_finance: checked(formData, 'can_manage_finance'),
    can_manage_settings: checked(formData, 'can_manage_settings'),
  };
}

function refresh() {
  revalidatePath('/admin/now/team');
  revalidatePath('/admin/now');
  revalidatePath('/admin/now/sections/system');
  revalidatePath('/admin/now/data/admin_members');
}

export async function addNowTeamMember(formData: FormData) {
  const { access } = await requireNowTableAccess('admin_members', true);
  const userId = value(formData, 'user_id');
  const role = value(formData, 'role');
  if (!userId || !roles.includes(role as (typeof roles)[number])) go('error', 'اختار الموظف والدور الوظيفي.');

  const admin = createAdminClient();
  const { error } = await admin.schema('now').from('admin_members').insert({
    user_id: userId,
    role,
    ...permissions(formData),
    is_active: true,
    created_by: access.user_id,
  });
  if (error) go('error', errorMessage(error));
  refresh();
  go('success', 'تمت إضافة الموظف إلى فريق Navienty Now.');
}

export async function updateNowTeamMember(formData: FormData) {
  await requireNowTableAccess('admin_members', true);
  const userId = value(formData, 'user_id');
  const role = value(formData, 'role');
  if (!userId || !roles.includes(role as (typeof roles)[number])) go('error', 'بيانات الموظف غير مكتملة.');

  const admin = createAdminClient();
  const { error } = await admin.schema('now').from('admin_members').update({
    role,
    ...permissions(formData),
    is_active: checked(formData, 'is_active'),
  }).eq('user_id', userId);
  if (error) go('error', errorMessage(error));
  refresh();
  go('success', 'تم حفظ صلاحيات الموظف.');
}

export async function removeNowTeamMember(formData: FormData) {
  const { access } = await requireNowTableAccess('admin_members', true);
  const userId = value(formData, 'user_id');
  if (!userId) go('error', 'الموظف غير محدد.');
  if (userId === access.user_id) go('error', 'لا يمكنك إزالة حساب الإدارة الذي تستخدمه الآن.');

  const admin = createAdminClient();
  const { error } = await admin.schema('now').from('admin_members').delete().eq('user_id', userId);
  if (error) go('error', errorMessage(error));
  refresh();
  go('success', 'تمت إزالة الموظف من فريق Navienty Now.');
}
