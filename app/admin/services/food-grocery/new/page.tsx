import { requireFoodGroceryPageAccess } from '@/src/lib/admin-auth'
import FoodProviderForm from '../components/FoodProviderForm'

export default async function NewFoodProviderPage() {
  await requireFoodGroceryPageAccess()

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">
          Add New Restaurant / Supermarket
        </h1>

        <FoodProviderForm />
      </div>
    </main>
  )
}