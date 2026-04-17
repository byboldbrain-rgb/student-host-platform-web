'use client'

import { useEffect, useState } from 'react'

type AdminUser = {
  id: string
  email: string
  full_name?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

export default function UniversitySuppliesAdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/university-supplies/admin-users')
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to fetch users')

      setUsers(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
      const res = await fetch(
        `/api/admin/university-supplies/admin-users/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !isActive }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update user')

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !isActive } : u
        )
      )
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return <p className="p-4">Loading...</p>
  }

  if (error) {
    return <p className="p-4 text-red-500">{error}</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Admin Users</h2>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.full_name || '-'}</td>
                <td className="px-4 py-2">
                  {user.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() =>
                      toggleUserStatus(user.id, !!user.is_active)
                    }
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="p-4 text-center text-gray-500">
            No admin users found.
          </p>
        )}
      </div>
    </div>
  )
}