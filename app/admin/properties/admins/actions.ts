'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requirePropertyAdminsManagementAccess } from '@/src/lib/admin-auth'

async function revalidateAdminsPages() {
  revalidatePath('/admin/properties/admins')
}

export async function createPropertyAdminAction(formData: FormData) {
  await requirePropertyAdminsManagementAccess()
  const supabase = createAdminClient()

  const email = String(formData.get('email') || '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') || '').trim()
  const role = String(formData.get('role') || '').trim()
  const password = String(formData.get('password') || '').trim()
  const brokerId = String(formData.get('broker_id') || '').trim()

  if (!email || !fullName || !role || !password) {
    throw new Error('All fields are required')
  }

  if (!['property_adder', 'property_editor'].includes(role)) {
    throw new Error('Invalid role')
  }

  if (role === 'property_editor' && !brokerId) {
    throw new Error('Broker is required for property editor')
  }

  const { data: createdAuthUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError || !createdAuthUser.user) {
    throw new Error(authError?.message || 'Failed to create auth user')
  }

  const { error: insertAdminError } = await supabase.from('admin_users').insert({
    id: createdAuthUser.user.id,
    email,
    full_name: fullName,
    role,
    department: 'properties',
    is_active: true,
    broker_id: role === 'property_editor' ? brokerId : null,
  })

  if (insertAdminError) {
    await supabase.auth.admin.deleteUser(createdAuthUser.user.id)
    throw new Error(insertAdminError.message)
  }

  await revalidateAdminsPages()
}

export async function togglePropertyAdminStatusAction(formData: FormData) {
  await requirePropertyAdminsManagementAccess()
  const supabase = createAdminClient()

  const adminId = String(formData.get('admin_id') || '')
  const nextIsActive = String(formData.get('next_is_active') || '') === 'true'

  if (!adminId) {
    throw new Error('Admin ID is required')
  }

  const { data: targetAdmin, error: targetAdminError } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', adminId)
    .maybeSingle()

  if (targetAdminError) {
    throw new Error(targetAdminError.message)
  }

  if (!targetAdmin) {
    throw new Error('Admin user not found')
  }

  if (targetAdmin.role === 'super_admin') {
    throw new Error('Super admin cannot be modified from this page')
  }

  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: nextIsActive })
    .eq('id', adminId)

  if (error) {
    throw new Error(error.message)
  }

  await revalidateAdminsPages()
}

export async function deletePropertyAdminAction(formData: FormData) {
  const adminContext = await requirePropertyAdminsManagementAccess()
  const supabase = createAdminClient()

  const adminId = String(formData.get('admin_id') || '')

  if (!adminId) {
    throw new Error('Admin ID is required')
  }

  if (adminId === adminContext.admin.id) {
    throw new Error('You cannot delete your own account')
  }

  const { data: adminUser, error: adminLookupError } = await supabase
    .from('admin_users')
    .select('id, role, department')
    .eq('id', adminId)
    .maybeSingle()

  if (adminLookupError) {
    throw new Error(adminLookupError.message)
  }

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  if (adminUser.role === 'super_admin') {
    throw new Error('Super admin cannot be deleted from this page')
  }

  const { error: deleteAdminRowError } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', adminId)

  if (deleteAdminRowError) {
    throw new Error(deleteAdminRowError.message)
  }

  const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(adminId)

  if (deleteAuthUserError) {
    throw new Error(deleteAuthUserError.message)
  }

  await revalidateAdminsPages()
}