export const ADMIN_SCOPE_CODES = {
  platform: 'platform',
  services: 'services',
  homes: 'homes',
  career: 'career',
  lost: 'lost',

  servicesRestaurants: 'services_restaurants',
  servicesGyms: 'services_gyms',
  servicesPharmacies: 'services_pharmacies',
  servicesClinics: 'services_clinics',
  servicesEvents: 'services_events',
  servicesBeautySalons: 'services_beauty-salons',
  servicesSupermarkets: 'services_supermarkets',
  servicesCoWorkingSpaces: 'services_co-working-spaces',
  servicesMaintenance: 'services_maintenance',
  servicesStationery: 'services_stationery',
  servicesBarbers: 'services_barbers',

  careerOnlinePortalJobs: 'career_online-portal-jobs',
  careerInternships: 'career_internships',
  careerOnlineCourses: 'career_online-courses',
} as const

export const ADMIN_ROUTE_PATHS = {
  adminDashboard: '/admin',
  adminUnauthorized: '/admin/unauthorized',
  adminServices: '/admin/services',
  adminProperties: '/admin/properties',
  adminCareer: '/admin/career',

  servicesRestaurants: '/admin/services/restaurants',
  servicesRestaurantsOrders: '/admin/services/restaurants/orders',
  servicesRestaurantsProviders: '/admin/services/restaurants/providers',

  servicesGyms: '/admin/services/gyms',
  servicesPharmacies: '/admin/services/pharmacies',
  servicesClinics: '/admin/services/clinics',
  servicesEvents: '/admin/services/events',
  servicesBeautySalons: '/admin/services/beauty-salons',
  servicesSupermarkets: '/admin/services/supermarkets',
  servicesCoWorkingSpaces: '/admin/services/co-working-spaces',
  servicesMaintenance: '/admin/services/maintenance',
  servicesStationery: '/admin/services/stationery',
  servicesBarbers: '/admin/services/barbers',

  careerOnlinePortalJobs: '/admin/career/online-portal-jobs',
  careerInternships: '/admin/career/internships',
  careerOnlineCourses: '/admin/career/online-courses',
} as const

export const SERVICE_CATEGORY_CONFIG = [
  {
    key: 'restaurants',
    title: 'Restaurants',
    scopeCode: ADMIN_SCOPE_CODES.servicesRestaurants,
    route: ADMIN_ROUTE_PATHS.servicesRestaurants,
  },
  {
    key: 'gyms',
    title: 'Gyms',
    scopeCode: ADMIN_SCOPE_CODES.servicesGyms,
    route: ADMIN_ROUTE_PATHS.servicesGyms,
  },
  {
    key: 'pharmacies',
    title: 'Pharmacies',
    scopeCode: ADMIN_SCOPE_CODES.servicesPharmacies,
    route: ADMIN_ROUTE_PATHS.servicesPharmacies,
  },
  {
    key: 'clinics',
    title: 'Clinics',
    scopeCode: ADMIN_SCOPE_CODES.servicesClinics,
    route: ADMIN_ROUTE_PATHS.servicesClinics,
  },
  {
    key: 'events',
    title: 'Events',
    scopeCode: ADMIN_SCOPE_CODES.servicesEvents,
    route: ADMIN_ROUTE_PATHS.servicesEvents,
  },
  {
    key: 'beauty-salons',
    title: 'Beauty Salons',
    scopeCode: ADMIN_SCOPE_CODES.servicesBeautySalons,
    route: ADMIN_ROUTE_PATHS.servicesBeautySalons,
  },
  {
    key: 'supermarkets',
    title: 'Supermarkets',
    scopeCode: ADMIN_SCOPE_CODES.servicesSupermarkets,
    route: ADMIN_ROUTE_PATHS.servicesSupermarkets,
  },
  {
    key: 'co-working-spaces',
    title: 'Co-Working Spaces',
    scopeCode: ADMIN_SCOPE_CODES.servicesCoWorkingSpaces,
    route: ADMIN_ROUTE_PATHS.servicesCoWorkingSpaces,
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    scopeCode: ADMIN_SCOPE_CODES.servicesMaintenance,
    route: ADMIN_ROUTE_PATHS.servicesMaintenance,
  },
  {
    key: 'stationery',
    title: 'Stationery',
    scopeCode: ADMIN_SCOPE_CODES.servicesStationery,
    route: ADMIN_ROUTE_PATHS.servicesStationery,
  },
  {
    key: 'barbers',
    title: 'Barbers',
    scopeCode: ADMIN_SCOPE_CODES.servicesBarbers,
    route: ADMIN_ROUTE_PATHS.servicesBarbers,
  },
] as const

export const CAREER_CATEGORY_CONFIG = [
  {
    key: 'online-portal-jobs',
    title: 'Online Portal Jobs',
    scopeCode: ADMIN_SCOPE_CODES.careerOnlinePortalJobs,
    route: ADMIN_ROUTE_PATHS.careerOnlinePortalJobs,
  },
  {
    key: 'internships',
    title: 'Internships',
    scopeCode: ADMIN_SCOPE_CODES.careerInternships,
    route: ADMIN_ROUTE_PATHS.careerInternships,
  },
  {
    key: 'online-courses',
    title: 'Online Courses',
    scopeCode: ADMIN_SCOPE_CODES.careerOnlineCourses,
    route: ADMIN_ROUTE_PATHS.careerOnlineCourses,
  },
] as const

export type AdminScopeCode =
  (typeof ADMIN_SCOPE_CODES)[keyof typeof ADMIN_SCOPE_CODES]

export type AdminRoutePath =
  (typeof ADMIN_ROUTE_PATHS)[keyof typeof ADMIN_ROUTE_PATHS]

export type ServiceCategoryConfig = (typeof SERVICE_CATEGORY_CONFIG)[number]
export type CareerCategoryConfig = (typeof CAREER_CATEGORY_CONFIG)[number]

export function getServiceCategoryByScopeCode(scopeCode: string) {
  return SERVICE_CATEGORY_CONFIG.find((item) => item.scopeCode === scopeCode) ?? null
}

export function getCareerCategoryByScopeCode(scopeCode: string) {
  return CAREER_CATEGORY_CONFIG.find((item) => item.scopeCode === scopeCode) ?? null
}

export function getServiceRouteByScopeCode(scopeCode: string) {
  return getServiceCategoryByScopeCode(scopeCode)?.route ?? null
}

export function getCareerRouteByScopeCode(scopeCode: string) {
  return getCareerCategoryByScopeCode(scopeCode)?.route ?? null
}

export function isServicesScope(scopeCode: string) {
  return (
    scopeCode === ADMIN_SCOPE_CODES.services ||
    scopeCode.startsWith('services_')
  )
}

export function isCareerScope(scopeCode: string) {
  return (
    scopeCode === ADMIN_SCOPE_CODES.career ||
    scopeCode.startsWith('career_')
  )
}