'use client'

import { useState } from 'react'

type UniversitySuppliesOrder = {
  id: number
  status?: string | null
  notes?: string | null
  handled_by_admin_id?: string | null
  handled_at?: string | null
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function ActionButton({
  children,
  tone = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'default' | 'success' | 'danger'
}) {
  const toneClass =
    tone === 'success'
      ? 'border-[#abefc6] bg-[#ecfdf3] text-[#067647] hover:bg-[#d1fadf]'
      : tone === 'danger'
      ? 'border-[#fecdca] bg-[#fef3f2] text-[#d92d20] hover:bg-[#fee4e2]'
      : 'border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]'

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        toneClass,
        props.className
      )}
    >
      {children}
    </button>
  )
}

export default function OrdersReceiverActions({
  order,
}: {
  order: UniversitySuppliesOrder
}) {
  const [status, setStatus] = useState(order.status || 'new')
  const [notes, setNotes] = useState(order.notes || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const updateOrder = async (nextStatus: string) => {
    try {
      setLoading(true)
      setMessage('')

      const res = await fetch(
        `/api/admin/university-supplies/orders/${order.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: nextStatus,
            notes: notes.trim() || null,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update order')
      }

      setStatus(nextStatus)
      setMessage('Order updated successfully.')
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#101828]">Receiver Actions</h3>
        <p className="mt-1 text-sm text-[#667085]">
          Review the request, add internal notes, then update the order status.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">
            Current Status
          </label>
          <div className="rounded-2xl border border-[#eaecf0] bg-[#fcfcfd] px-4 py-3 text-sm font-semibold text-[#101828]">
            {status}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">
            Next Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
          >
            <option value="new">new</option>
            <option value="sent_to_provider">sent_to_provider</option>
            <option value="accepted">accepted</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[#344054]">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes for the admin team..."
            className="min-h-[120px] w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe]"
          />
        </div>
      </div>

      {message ? (
        <div
          className={cn(
            'mt-5 rounded-2xl border px-4 py-3 text-sm',
            message.toLowerCase().includes('success')
              ? 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]'
              : 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]'
          )}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <ActionButton
          type="button"
          tone="default"
          disabled={loading}
          onClick={() => updateOrder(status)}
        >
          {loading ? 'Saving...' : 'Save Status'}
        </ActionButton>

        <ActionButton
          type="button"
          tone="success"
          disabled={loading}
          onClick={() => updateOrder('completed')}
        >
          Mark Completed
        </ActionButton>

        <ActionButton
          type="button"
          tone="danger"
          disabled={loading}
          onClick={() => updateOrder('cancelled')}
        >
          Cancel Order
        </ActionButton>
      </div>
    </div>
  )
}