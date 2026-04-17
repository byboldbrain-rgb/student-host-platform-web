import { requireUniversitySuppliesPageAccess } from '@/src/lib/admin-auth'
import UniversitySuppliesProviderForm from '../components/UniversitySuppliesProviderForm'

export default async function NewUniversitySuppliesProviderPage() {
  await requireUniversitySuppliesPageAccess()

  return <UniversitySuppliesProviderForm />
}