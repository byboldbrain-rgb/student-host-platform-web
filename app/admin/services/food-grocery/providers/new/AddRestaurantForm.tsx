'use client'

import { useState } from 'react'

export default function AddRestaurantForm() {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    phone: '',
    whatsapp_number: '',
    slug: '',
    description_en: '',
    description_ar: '',
    category: 'restaurants',
  })

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name_en || !form.phone) {
      alert('Missing required fields')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      alert('✅ Added successfully')

      setForm({
        name_en: '',
        name_ar: '',
        phone: '',
        whatsapp_number: '',
        slug: '',
        description_en: '',
        description_ar: '',
        category: 'restaurants',
      })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-6">

      {/* BASIC INFO */}
      <div>
        <h2 className="font-semibold mb-3">Basic Info</h2>

        <input
          placeholder="Name (EN)"
          value={form.name_en}
          onChange={(e) => handleChange('name_en', e.target.value)}
          className="input"
        />

        <input
          placeholder="Name (AR)"
          value={form.name_ar}
          onChange={(e) => handleChange('name_ar', e.target.value)}
          className="input"
        />

        <input
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          className="input"
        />
      </div>

      {/* CONTACT */}
      <div>
        <h2 className="font-semibold mb-3">Contact</h2>

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className="input"
        />

        <input
          placeholder="WhatsApp"
          value={form.whatsapp_number}
          onChange={(e) => handleChange('whatsapp_number', e.target.value)}
          className="input"
        />
      </div>

      {/* CATEGORY */}
      <div>
        <h2 className="font-semibold mb-3">Category</h2>

        <select
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="input"
        >
          <option value="restaurants">Restaurant</option>
          <option value="supermarkets">Supermarket</option>
        </select>
      </div>

      {/* DESCRIPTION */}
      <div>
        <h2 className="font-semibold mb-3">Description</h2>

        <textarea
          placeholder="Description EN"
          value={form.description_en}
          onChange={(e) => handleChange('description_en', e.target.value)}
          className="input"
        />

        <textarea
          placeholder="Description AR"
          value={form.description_ar}
          onChange={(e) => handleChange('description_ar', e.target.value)}
          className="input"
        />
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}