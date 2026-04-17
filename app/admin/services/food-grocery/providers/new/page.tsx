import { requireFoodGroceryPageAccess } from '@/src/lib/admin-auth'
import AddRestaurantForm from './AddRestaurantForm'

export default async function AddRestaurantPage() {
  await requireFoodGroceryPageAccess()

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">
          Add New Restaurant / Supermarket
        </h1>

        <AddRestaurantForm />
      </div>
    </main>
  )
}