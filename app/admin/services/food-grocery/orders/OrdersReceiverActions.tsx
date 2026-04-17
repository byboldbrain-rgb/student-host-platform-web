'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function OrdersReceiverActions({
  orderId,
}: {
  orderId: number
}) {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<'accepted' | 'cancelled' | null>(null)
  const [error, setError] = useState('')

  const handleAction = async (status: 'accepted' | 'cancelled') => {
    try {
      setError('')
      setLoadingAction(status)

      const response = await fetch(`/api/admin/food-grocery/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update order')
      }

      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => handleAction('accepted')}
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {loadingAction === 'accepted' ? 'Confirming...' : 'Confirm Order'}
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => handleAction('cancelled')}
          className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loadingAction === 'cancelled' ? 'Cancelling...' : 'Cancel Order'}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  )
}