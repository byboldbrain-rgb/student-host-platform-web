import { requireUniversitySuppliesPageAccess } from '@/src/lib/admin-auth'
import AddUniversitySuppliesForm from './AddUniversitySuppliesForm'

export default async function AddUniversitySuppliesPage() {
  await requireUniversitySuppliesPageAccess()

  return <AddUniversitySuppliesForm />
}