import { redirect } from 'next/navigation'

export default function HealthAdminPage() {
  redirect('/admin/services/health/doctors')
}