'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FoodAdminUser = {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
  is_active: boolean
  created_at?: string | null
}

type RestaurantOption = {
  id: number
  name_en: string
  name_ar?: string | null
}

const ROLE_OPTIONS = [
  'food_super_admin',
  'food_adder',
  'food_editor',
  'food_receiver',
] as const

function formatDate(date?: string | null) {
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  } catch {
    return '—'
  }
}

function getRoleBadgeClass(role: string) {
  if (role === 'food_super_admin') {
    return 'border-purple-200 bg-purple-50 text-purple-700'
  }

  if (role === 'food_adder') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (role === 'food_editor') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (role === 'food_receiver') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  return 'border-gray-200 bg-gray-100 text-gray-700'
}

function getRestaurantLabel(option?: RestaurantOption | null) {
  if (!option) return '—'
  return option.name_en || option.name_ar || `Restaurant #${option.id}`
}

export default function FoodAdminUsersManager({
  initialUsers,
  restaurantOptions,
}: {
  initialUsers: FoodAdminUser[]
  restaurantOptions: RestaurantOption[]
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'food_receiver',
    provider_id: '',
  })

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      setMessage('')

      if (
        form.role === 'food_editor' &&
        (!form.provider_id || Number.isNaN(Number(form.provider_id)))
      ) {
        throw new Error('Please select the restaurant for this food editor')
      }

      const payload = {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        provider_id:
          form.role === 'food_editor' && form.provider_id
            ? Number(form.provider_id)
            : null,
      }

      const response = await fetch('/api/admin/food-grocery/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to create admin user')
      }

      setForm({
        email: '',
        password: '',
        full_name: '',
        role: 'food_receiver',
        provider_id: '',
      })

      setMessage('Admin user created successfully')
      router.refresh()
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (userId: string, nextValue: boolean) => {
    try {
      setMessage('')

      const response = await fetch(`/api/admin/food-grocery/admin-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextValue }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update admin user')
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_active: nextValue } : user
        )
      )

      setMessage('User status updated')
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong')
    }
  }

  const handleRoleChange = async (userId: string, nextRole: string) => {
    try {
      setMessage('')

      const response = await fetch(`/api/admin/food-grocery/admin-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update role')
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: nextRole } : user
        )
      )

      setMessage('User role updated')
    } catch (error: any) {
      setMessage(error?.message || 'Something went wrong')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-semibold text-gray-900">Create Staff Account</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-xl border border-gray-300 px-4 py-3"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />

          <input
            className="rounded-xl border border-gray-300 px-4 py-3"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />

          <input
            className="rounded-xl border border-gray-300 px-4 py-3"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />

          <select
            className="rounded-xl border border-gray-300 px-4 py-3"
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                role: e.target.value,
                provider_id: e.target.value === 'food_editor' ? prev.provider_id : '',
              }))
            }
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {form.role === 'food_editor' && (
            <select
              className="rounded-xl border border-gray-300 px-4 py-3 md:col-span-2"
              value={form.provider_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, provider_id: e.target.value }))
              }
            >
              <option value="">Select Restaurant</option>
              {restaurantOptions.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {getRestaurantLabel(restaurant)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Staff Member'}
          </button>

          {message ? <span className="text-sm text-gray-600">{message}</span> : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Existing Staff</h2>
            <p className="mt-1 text-sm text-gray-500">
              Total staff members: {users.length}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Department
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Created At
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {user.department || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        user.is_active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}