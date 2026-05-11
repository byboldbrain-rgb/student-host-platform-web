'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { requirePropertyReviewerAccess } from '@/src/lib/admin-auth'

type PropertyReviewStatus =
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived'

async function updatePropertyReviewStatus(
  propertyId: string,
  nextStatus: PropertyReviewStatus,
  reviewNotes?: string
) {
  const adminContext = await requirePropertyReviewerAccess()
  const supabase = await createClient()

  const isPublished = nextStatus === 'published'
  const isPendingReview = nextStatus === 'pending_review'

  const { error } = await supabase
    .from('properties')
    .update({
      admin_status: nextStatus,
      is_active: isPublished,
      reviewed_by_admin_id: isPendingReview ? null : adminContext.admin.id,
      reviewed_at: isPendingReview ? null : new Date().toISOString(),
      review_notes: reviewNotes?.trim() || null,
      updated_by_admin_id: adminContext.admin.id,
    })
    .eq('id', propertyId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/properties/review')
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  revalidatePath('/properties/search')
}

export async function approvePropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'published', reviewNotes)
}

export async function rejectPropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'rejected', reviewNotes)
}

export async function archivePropertyAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes = String(formData.get('review_notes') || '')

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'archived', reviewNotes)
}

export async function returnPropertyToReviewAction(formData: FormData) {
  const propertyId = String(formData.get('property_id') || '')
  const reviewNotes =
    String(formData.get('review_notes') || '').trim() ||
    'Returned to review after being published.'

  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  await updatePropertyReviewStatus(propertyId, 'pending_review', reviewNotes)
}