import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export type AdminDepartment =
  | 'properties'
  | 'services'
  | 'career'
  | 'food_grocery'
  | 'health'
  | 'university_supplies'
  | 'student_activities'
  | 'co_working_spaces'
  | 'community'

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'AR'
  | 'AP'
  | 'accountant'
  | 'properties_super_admin'
  | 'property_adder'
  | 'property_editor'
  | 'property_receiver'
  | 'property_owner'
  | 'food_super_admin'
  | 'food_adder'
  | 'food_editor'
  | 'food_receiver'
  | 'university_supplies_super_admin'
  | 'university_supplies_adder'
  | 'university_supplies_editor'
  | 'university_supplies_receiver'
  | 'health_super_admin'
  | 'health_adder'
  | 'health_editor'
  | 'health_receiver'
  | 'student_activities_super_admin'
  | 'student_activities_adder'
  | 'student_activities_editor'
  | 'student_activities_receiver'
  | 'coworking_super_admin'
  | 'coworking_adder'
  | 'coworking_editor'
  | 'coworking_receiver'
  | 'community_super_admin'
  | 'community_editor'
  | 'community_hr'

export type AdminProfile = {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  role: AdminRole | string
  department: AdminDepartment | null
  broker_id: string | null
  owner_id: string | null
  username?: string | null
}

export type CurrentAdminContext = {
  user: {
    id: string
    email: string
  }
  admin: AdminProfile
}

async function getSupabase() {
  return createClient()
}

export async function getCurrentAuthUser() {
  const supabase = await getSupabase()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.id || !user.email) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
  }
}

export async function getCurrentAdminContext(): Promise<CurrentAdminContext | null> {
  const supabase = await getSupabase()
  const user = await getCurrentAuthUser()

  if (!user) {
    return null
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select(
      'id, email, full_name, is_active, created_at, role, department, broker_id, owner_id, username'
    )
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError || !admin) {
    return null
  }

  return {
    user,
    admin: admin as AdminProfile,
  }
}

export async function requireAdmin() {
  const adminContext = await getCurrentAdminContext()

  if (!adminContext) {
    redirect('/admin/login')
  }

  return adminContext
}

export function isSuperAdmin(admin: AdminProfile) {
  return admin.role === 'super_admin'
}

/* =========================
   Finance / Accountant / AR / AP
========================= */

export function isARAdmin(admin: AdminProfile) {
  return admin.role === 'AR'
}

export function isAPAdmin(admin: AdminProfile) {
  return admin.role === 'AP'
}

export function isAccountantAdmin(admin: AdminProfile) {
  return admin.role === 'accountant'
}

export function hasFinanceAccess(admin: AdminProfile) {
  return (
    isSuperAdmin(admin) ||
    isARAdmin(admin) ||
    isAPAdmin(admin) ||
    isAccountantAdmin(admin)
  )
}

export function hasAccountantAccess(admin: AdminProfile) {
  return isSuperAdmin(admin) || isAccountantAdmin(admin)
}

export function hasDepositRequestsAccess(admin: AdminProfile) {
  return isSuperAdmin(admin) || isARAdmin(admin) || isAccountantAdmin(admin)
}

export function hasOwnerSettlementsAccess(admin: AdminProfile) {
  return isSuperAdmin(admin) || isAPAdmin(admin) || isAccountantAdmin(admin)
}

export async function requireAccountantAccess() {
  const adminContext = await requireAdmin()

  if (!hasAccountantAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireFinanceAccess() {
  const adminContext = await requireAdmin()

  if (!hasFinanceAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireDepositRequestsAccess() {
  const adminContext = await requireAdmin()

  if (!hasDepositRequestsAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireOwnerSettlementsAccess() {
  const adminContext = await requireAdmin()

  if (!hasOwnerSettlementsAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

/* =========================
   Owners Portal
========================= */

export function isPropertyOwner(admin: AdminProfile) {
  return admin.role === 'property_owner' && Boolean(admin.owner_id)
}

export function canAccessOwnerPortal(admin: AdminProfile) {
  return isPropertyOwner(admin)
}

export async function requirePropertyOwnerAccess() {
  const adminContext = await requireAdmin()

  if (!canAccessOwnerPortal(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

/* =========================
   Properties
========================= */

export function isPropertiesSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'properties_super_admin'
}

export function isPropertiesAdmin(admin: AdminProfile) {
  return admin.department === 'properties' || isPropertiesSuperAdmin(admin)
}

export function isPropertyAdder(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin) || admin.role === 'property_adder'
}

export function isPropertyEditor(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin) || admin.role === 'property_editor'
}

export function isPropertyReceiver(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin) || admin.role === 'property_receiver'
}

export function canAccessPropertiesSection(admin: AdminProfile) {
  return (
    isPropertiesSuperAdmin(admin) ||
    admin.role === 'property_adder' ||
    admin.role === 'property_editor' ||
    admin.role === 'property_receiver'
  )
}

export function canCreateProperties(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin) || admin.role === 'property_adder'
}

export function canEditProperties(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin) || admin.role === 'property_editor'
}

export function canReviewProperties(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin)
}

export function canManagePropertyAdmins(admin: AdminProfile) {
  return isPropertiesSuperAdmin(admin)
}

export function canReceivePropertyBookingRequests(admin: AdminProfile) {
  return (
    isPropertiesSuperAdmin(admin) ||
    admin.role === 'property_editor' ||
    admin.role === 'property_receiver'
  )
}

/* =========================
   Generic Services
========================= */

export function hasServicesSectionAccess(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.department === 'services'
}

/* =========================
   Food & Grocery
========================= */

export function isFoodSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'food_super_admin'
}

export function hasFoodGrocerySectionAccess(admin: AdminProfile) {
  return (
    isFoodSuperAdmin(admin) ||
    admin.role === 'food_adder' ||
    admin.role === 'food_editor' ||
    admin.role === 'food_receiver' ||
    admin.department === 'food_grocery'
  )
}

export function canCreateFoodProviders(admin: AdminProfile) {
  return isFoodSuperAdmin(admin) || admin.role === 'food_adder'
}

export function canEditFoodProviders(admin: AdminProfile) {
  return isFoodSuperAdmin(admin) || admin.role === 'food_editor'
}

export function canReceiveFoodOrders(admin: AdminProfile) {
  return isFoodSuperAdmin(admin) || admin.role === 'food_receiver'
}

export function canManageFoodAdmins(admin: AdminProfile) {
  return isFoodSuperAdmin(admin)
}

/* =========================
   University Supplies
========================= */

export function isUniversitySuppliesSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'university_supplies_super_admin'
}

export function hasUniversitySuppliesSectionAccess(admin: AdminProfile) {
  return (
    isUniversitySuppliesSuperAdmin(admin) ||
    admin.role === 'university_supplies_adder' ||
    admin.role === 'university_supplies_editor' ||
    admin.role === 'university_supplies_receiver' ||
    admin.department === 'university_supplies'
  )
}

export function canCreateUniversitySuppliesProviders(admin: AdminProfile) {
  return (
    isUniversitySuppliesSuperAdmin(admin) ||
    admin.role === 'university_supplies_adder'
  )
}

export function canEditUniversitySuppliesProviders(admin: AdminProfile) {
  return (
    isUniversitySuppliesSuperAdmin(admin) ||
    admin.role === 'university_supplies_editor'
  )
}

export function canReceiveUniversitySuppliesOrders(admin: AdminProfile) {
  return (
    isUniversitySuppliesSuperAdmin(admin) ||
    admin.role === 'university_supplies_receiver'
  )
}

export function canManageUniversitySuppliesAdmins(admin: AdminProfile) {
  return isUniversitySuppliesSuperAdmin(admin)
}

/* =========================
   Health
========================= */

export function isHealthSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'health_super_admin'
}

export function hasHealthSectionAccess(admin: AdminProfile) {
  return (
    isHealthSuperAdmin(admin) ||
    admin.role === 'health_adder' ||
    admin.role === 'health_editor' ||
    admin.role === 'health_receiver' ||
    admin.department === 'health'
  )
}

export function canCreateHealthProviders(admin: AdminProfile) {
  return isHealthSuperAdmin(admin) || admin.role === 'health_adder'
}

export function canEditHealthProviders(admin: AdminProfile) {
  return isHealthSuperAdmin(admin) || admin.role === 'health_editor'
}

export function canReceiveHealthOrders(admin: AdminProfile) {
  return isHealthSuperAdmin(admin) || admin.role === 'health_receiver'
}

export function canManageHealthAdmins(admin: AdminProfile) {
  return isHealthSuperAdmin(admin)
}

/* =========================
   Student Activities
========================= */

export function isStudentActivitiesSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'student_activities_super_admin'
}

export function hasStudentActivitiesSectionAccess(admin: AdminProfile) {
  return (
    isStudentActivitiesSuperAdmin(admin) ||
    admin.role === 'student_activities_adder' ||
    admin.role === 'student_activities_editor' ||
    admin.role === 'student_activities_receiver' ||
    admin.department === 'student_activities'
  )
}

export function canCreateStudentActivities(admin: AdminProfile) {
  return (
    isStudentActivitiesSuperAdmin(admin) ||
    admin.role === 'student_activities_adder'
  )
}

export function canEditStudentActivities(admin: AdminProfile) {
  return (
    isStudentActivitiesSuperAdmin(admin) ||
    admin.role === 'student_activities_editor'
  )
}

export function canReceiveStudentActivitiesApplicationsAccess(admin: AdminProfile) {
  return (
    isStudentActivitiesSuperAdmin(admin) ||
    admin.role === 'student_activities_receiver'
  )
}

export function canManageStudentActivitiesAdmins(admin: AdminProfile) {
  return isStudentActivitiesSuperAdmin(admin)
}

/* =========================
   Co-working Spaces
========================= */

export function isCoworkingSuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'coworking_super_admin'
}

export function hasCoworkingSectionAccess(admin: AdminProfile) {
  return (
    isCoworkingSuperAdmin(admin) ||
    admin.role === 'coworking_adder' ||
    admin.role === 'coworking_editor' ||
    admin.role === 'coworking_receiver' ||
    admin.department === 'co_working_spaces'
  )
}

export function canCreateCoworkingSpaces(admin: AdminProfile) {
  return isCoworkingSuperAdmin(admin) || admin.role === 'coworking_adder'
}

export function canEditCoworkingSpaces(admin: AdminProfile) {
  return isCoworkingSuperAdmin(admin) || admin.role === 'coworking_editor'
}

export function canReceiveCoworkingBookings(admin: AdminProfile) {
  return isCoworkingSuperAdmin(admin) || admin.role === 'coworking_receiver'
}

export function canManageCoworkingAdmins(admin: AdminProfile) {
  return isCoworkingSuperAdmin(admin)
}

/* =========================
   Community
========================= */

export function isCommunitySuperAdmin(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.role === 'community_super_admin'
}

export function hasCommunitySectionAccess(admin: AdminProfile) {
  return (
    isCommunitySuperAdmin(admin) ||
    admin.role === 'community_editor' ||
    admin.role === 'community_hr' ||
    admin.department === 'community'
  )
}

export function canManageCommunityPosts(admin: AdminProfile) {
  return isCommunitySuperAdmin(admin) || admin.role === 'community_editor'
}

export function canManageCommunityJoinRequests(admin: AdminProfile) {
  return isCommunitySuperAdmin(admin) || admin.role === 'community_hr'
}

export function canManageCommunityAdmins(admin: AdminProfile) {
  return isCommunitySuperAdmin(admin)
}

/* =========================
   Career
========================= */

export function hasCareerSectionAccess(admin: AdminProfile) {
  return isSuperAdmin(admin) || admin.department === 'career'
}

export function getDefaultAdminRoute(admin: AdminProfile) {
  if (admin.role === 'property_owner') {
    return admin.owner_id ? '/admin/owners' : '/admin/unauthorized'
  }

  if (isSuperAdmin(admin)) {
    return '/admin'
  }

  if (admin.role === 'accountant') {
    return '/admin/finance/accountant'
  }

  if (admin.role === 'AR') {
    return '/admin/finance/deposit-requests'
  }

  if (admin.role === 'AP') {
    return '/admin/finance/owner-settlements'
  }

  if (admin.role === 'properties_super_admin') {
    return '/admin/properties'
  }

  if (admin.role === 'property_adder') {
    return '/admin/properties/new'
  }

  if (admin.role === 'property_editor') {
    return '/admin/properties'
  }

  if (admin.role === 'property_receiver') {
    return '/admin/properties/booking-requests'
  }

  if (admin.role === 'food_super_admin') {
    return '/admin/services/food-grocery'
  }

  if (admin.role === 'food_adder') {
    return '/admin/services/food-grocery/new'
  }

  if (admin.role === 'food_editor') {
    return '/admin/services/food-grocery'
  }

  if (admin.role === 'food_receiver') {
    return '/admin/services/food-grocery/orders'
  }

  if (admin.role === 'university_supplies_super_admin') {
    return '/admin/services/university-supplies'
  }

  if (admin.role === 'university_supplies_adder') {
    return '/admin/services/university-supplies/new'
  }

  if (admin.role === 'university_supplies_editor') {
    return '/admin/services/university-supplies'
  }

  if (admin.role === 'university_supplies_receiver') {
    return '/admin/services/university-supplies/orders'
  }

  if (admin.role === 'health_super_admin') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_adder') {
    return '/admin/services/health/doctors/new'
  }

  if (admin.role === 'health_editor') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_receiver') {
    return '/admin/services/health'
  }

  if (admin.role === 'student_activities_super_admin') {
    return '/admin/services/student-activities'
  }

  if (admin.role === 'student_activities_adder') {
    return '/admin/services/student-activities/new'
  }

  if (admin.role === 'student_activities_editor') {
    return '/admin/services/student-activities'
  }

  if (admin.role === 'student_activities_receiver') {
    return '/admin/services/student-activities'
  }

  if (admin.role === 'coworking_super_admin') {
    return '/admin/services/co-working-spaces'
  }

  if (admin.role === 'coworking_adder') {
    return '/admin/services/co-working-spaces/new'
  }

  if (admin.role === 'coworking_editor') {
    return '/admin/services/co-working-spaces'
  }

  if (admin.role === 'coworking_receiver') {
    return '/admin/services/co-working-spaces/booking-requests'
  }

  if (admin.role === 'community_super_admin') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_editor') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_hr') {
    return '/admin/community/join-requests'
  }

  if (admin.department === 'community') {
    return '/admin/community/posts'
  }

  if (admin.department === 'student_activities') {
    return '/admin/services/student-activities'
  }

  if (admin.department === 'health') {
    return '/admin/services/health'
  }

  if (admin.department === 'food_grocery') {
    return '/admin/services/food-grocery'
  }

  if (admin.department === 'university_supplies') {
    return '/admin/services/university-supplies'
  }

  if (admin.department === 'co_working_spaces') {
    return '/admin/services/co-working-spaces'
  }

  if (hasCareerSectionAccess(admin)) {
    return '/admin/career'
  }

  if (hasCommunitySectionAccess(admin)) {
    return '/admin/community/posts'
  }

  if (hasStudentActivitiesSectionAccess(admin)) {
    return '/admin/services/student-activities'
  }

  if (hasHealthSectionAccess(admin)) {
    return '/admin/services/health'
  }

  if (hasUniversitySuppliesSectionAccess(admin)) {
    return '/admin/services/university-supplies'
  }

  if (hasFoodGrocerySectionAccess(admin)) {
    return '/admin/services/food-grocery'
  }

  if (hasCoworkingSectionAccess(admin)) {
    return '/admin/services/co-working-spaces'
  }

  if (hasServicesSectionAccess(admin)) {
    return '/admin/services'
  }

  if (canAccessPropertiesSection(admin)) {
    return '/admin/properties'
  }

  return '/admin/unauthorized'
}

export async function requireSuperAdminAccess() {
  const adminContext = await requireAdmin()

  if (!isSuperAdmin(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertiesSectionAccess() {
  const adminContext = await requireAdmin()

  if (!canAccessPropertiesSection(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertyCreatorAccess() {
  const adminContext = await requireAdmin()

  if (!canCreateProperties(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertyEditorAccess() {
  const adminContext = await requireAdmin()

  if (!canEditProperties(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertyReviewerAccess() {
  const adminContext = await requireAdmin()

  if (!canReviewProperties(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertyAdminsManagementAccess() {
  const adminContext = await requireAdmin()

  if (!canManagePropertyAdmins(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requirePropertyBookingRequestsAccess() {
  const adminContext = await requireAdmin()

  if (!canReceivePropertyBookingRequests(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireServicesPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasServicesSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireFoodGroceryPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasFoodGrocerySectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireUniversitySuppliesPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasUniversitySuppliesSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireHealthPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasHealthSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireStudentActivitiesPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasStudentActivitiesSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireCareerPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasCareerSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireCoworkingPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasCoworkingSectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireCommunityPageAccess() {
  const adminContext = await requireAdmin()

  if (!hasCommunitySectionAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireCommunityPostsAccess() {
  const adminContext = await requireAdmin()

  if (!canManageCommunityPosts(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export async function requireCommunityJoinRequestsAccess() {
  const adminContext = await requireAdmin()

  if (!canManageCommunityJoinRequests(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export function hasFoodOrdersAccess(admin: AdminProfile) {
  return isFoodSuperAdmin(admin) || admin.role === 'food_receiver'
}

export async function requireFoodOrdersAccess() {
  const adminContext = await requireAdmin()

  if (!hasFoodOrdersAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export function hasUniversitySuppliesOrdersAccess(admin: AdminProfile) {
  return (
    isUniversitySuppliesSuperAdmin(admin) ||
    admin.role === 'university_supplies_receiver'
  )
}

export async function requireUniversitySuppliesOrdersAccess() {
  const adminContext = await requireAdmin()

  if (!hasUniversitySuppliesOrdersAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export function hasHealthOrdersAccess(admin: AdminProfile) {
  return isHealthSuperAdmin(admin) || admin.role === 'health_receiver'
}

export async function requireHealthOrdersAccess() {
  const adminContext = await requireAdmin()

  if (!hasHealthOrdersAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export function hasStudentActivitiesApplicationsAccess(admin: AdminProfile) {
  return (
    isStudentActivitiesSuperAdmin(admin) ||
    admin.role === 'student_activities_receiver'
  )
}

export async function requireStudentActivitiesApplicationsAccess() {
  const adminContext = await requireAdmin()

  if (!hasStudentActivitiesApplicationsAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}

export function hasCoworkingBookingsAccess(admin: AdminProfile) {
  return isCoworkingSuperAdmin(admin) || admin.role === 'coworking_receiver'
}

export async function requireCoworkingBookingsAccess() {
  const adminContext = await requireAdmin()

  if (!hasCoworkingBookingsAccess(adminContext.admin)) {
    redirect('/admin/unauthorized')
  }

  return adminContext
}