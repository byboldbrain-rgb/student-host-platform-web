'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type CityOption = {
  id: string
  name_en: string
  name_ar: string
}

type SpecialtyOption = {
  id: number
  name_en: string
  name_ar: string
  slug: string
}

type DoctorFormState = {
  slug: string
  full_name_en: string
  full_name_ar: string
  title_en: string
  title_ar: string
  gender: 'male' | 'female' | ''
  bio_en: string
  bio_ar: string
  photo_url: string
  years_of_experience: string
  consultation_fee: string
  is_featured: boolean
  is_active: boolean
  phone: string
  whatsapp_number: string
  email: string
  clinic_name_en: string
  clinic_name_ar: string
  clinic_slug: string
  clinic_phone: string
  clinic_email: string
  clinic_website_url: string
  clinic_whatsapp_number: string
  clinic_address_line: string
  clinic_google_maps_url: string
  clinic_logo_url: string
  clinic_cover_image_url: string
  clinic_short_description_en: string
  clinic_short_description_ar: string
  clinic_full_description_en: string
  clinic_full_description_ar: string
  city_id: string
  specialty_subcategory_id: string
}

const initialFormState: DoctorFormState = {
  slug: '',
  full_name_en: '',
  full_name_ar: '',
  title_en: '',
  title_ar: '',
  gender: '',
  bio_en: '',
  bio_ar: '',
  photo_url: '',
  years_of_experience: '',
  consultation_fee: '',
  is_featured: false,
  is_active: true,
  phone: '',
  whatsapp_number: '',
  email: '',
  clinic_name_en: '',
  clinic_name_ar: '',
  clinic_slug: '',
  clinic_phone: '',
  clinic_email: '',
  clinic_website_url: '',
  clinic_whatsapp_number: '',
  clinic_address_line: '',
  clinic_google_maps_url: '',
  clinic_logo_url: '',
  clinic_cover_image_url: '',
  clinic_short_description_en: '',
  clinic_short_description_ar: '',
  clinic_full_description_en: '',
  clinic_full_description_ar: '',
  city_id: '',
  specialty_subcategory_id: '',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function EditDoctorPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = useMemo(() => createClient(), [])

  const doctorId = Array.isArray(params.id) ? params.id[0] : params.id

  const [form, setForm] = useState<DoctorFormState>(initialFormState)
  const [cities, setCities] = useState<CityOption[]>([])
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [selectedFileName, setSelectedFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchPageData = async () => {
      if (!doctorId) {
        setErrorMessage('Doctor id is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const [doctorRes, citiesRes, categoriesRes] = await Promise.all([
        supabase
          .from('health_doctors')
          .select(
            `
              id,
              slug,
              full_name_en,
              full_name_ar,
              title_en,
              title_ar,
              gender,
              bio_en,
              bio_ar,
              photo_url,
              years_of_experience,
              consultation_fee,
              is_featured,
              is_active,
              phone,
              whatsapp_number,
              email,
              clinic_name_en,
              clinic_name_ar,
              clinic_slug,
              clinic_phone,
              clinic_email,
              clinic_website_url,
              clinic_whatsapp_number,
              clinic_address_line,
              clinic_google_maps_url,
              clinic_logo_url,
              clinic_cover_image_url,
              clinic_short_description_en,
              clinic_short_description_ar,
              clinic_full_description_en,
              clinic_full_description_ar,
              city_id,
              specialty_subcategory_id
            `
          )
          .eq('id', doctorId)
          .maybeSingle(),

        supabase
          .from('cities')
          .select('id, name_en, name_ar')
          .order('name_en', { ascending: true }),

        supabase
          .from('service_subcategories')
          .select('id, name_en, name_ar, slug, category_id')
          .order('name_en', { ascending: true }),
      ])

      if (doctorRes.error || !doctorRes.data) {
        setErrorMessage(
          doctorRes.error?.message || 'Failed to load doctor details.'
        )
        setLoading(false)
        return
      }

      if (citiesRes.error) {
        setErrorMessage(citiesRes.error.message || 'Failed to load cities.')
        setLoading(false)
        return
      }

      if (categoriesRes.error) {
        setErrorMessage(
          categoriesRes.error.message || 'Failed to load specialties.'
        )
        setLoading(false)
        return
      }

      setCities(citiesRes.data || [])
      setSpecialties(
        (categoriesRes.data || []).map((item) => ({
          id: item.id,
          name_en: item.name_en,
          name_ar: item.name_ar,
          slug: item.slug,
        }))
      )

      const doctor = doctorRes.data

      setForm({
        slug: doctor.slug ?? '',
        full_name_en: doctor.full_name_en ?? '',
        full_name_ar: doctor.full_name_ar ?? '',
        title_en: doctor.title_en ?? '',
        title_ar: doctor.title_ar ?? '',
        gender:
          doctor.gender === 'male' || doctor.gender === 'female'
            ? doctor.gender
            : '',
        bio_en: doctor.bio_en ?? '',
        bio_ar: doctor.bio_ar ?? '',
        photo_url: doctor.photo_url ?? '',
        years_of_experience:
          doctor.years_of_experience !== null &&
          doctor.years_of_experience !== undefined
            ? String(doctor.years_of_experience)
            : '',
        consultation_fee:
          doctor.consultation_fee !== null &&
          doctor.consultation_fee !== undefined
            ? String(doctor.consultation_fee)
            : '',
        is_featured: doctor.is_featured ?? false,
        is_active: doctor.is_active ?? true,
        phone: doctor.phone ?? '',
        whatsapp_number: doctor.whatsapp_number ?? '',
        email: doctor.email ?? '',
        clinic_name_en: doctor.clinic_name_en ?? '',
        clinic_name_ar: doctor.clinic_name_ar ?? '',
        clinic_slug: doctor.clinic_slug ?? '',
        clinic_phone: doctor.clinic_phone ?? '',
        clinic_email: doctor.clinic_email ?? '',
        clinic_website_url: doctor.clinic_website_url ?? '',
        clinic_whatsapp_number: doctor.clinic_whatsapp_number ?? '',
        clinic_address_line: doctor.clinic_address_line ?? '',
        clinic_google_maps_url: doctor.clinic_google_maps_url ?? '',
        clinic_logo_url: doctor.clinic_logo_url ?? '',
        clinic_cover_image_url: doctor.clinic_cover_image_url ?? '',
        clinic_short_description_en: doctor.clinic_short_description_en ?? '',
        clinic_short_description_ar: doctor.clinic_short_description_ar ?? '',
        clinic_full_description_en: doctor.clinic_full_description_en ?? '',
        clinic_full_description_ar: doctor.clinic_full_description_ar ?? '',
        city_id: doctor.city_id ?? '',
        specialty_subcategory_id: doctor.specialty_subcategory_id
          ? String(doctor.specialty_subcategory_id)
          : '',
      })

      setLoading(false)
    }

    fetchPageData()
  }, [doctorId, supabase])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedPhotoFile(null)
      setSelectedFileName('')
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl('')
      return
    }

    setSelectedPhotoFile(file)
    setSelectedFileName(file.name)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const localPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(localPreviewUrl)
  }

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setSelectedPhotoFile(null)
    setSelectedFileName('')

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl('')

    setForm((prev) => ({
      ...prev,
      photo_url: '',
    }))
  }

  const autoGenerateDoctorSlug = () => {
    if (!form.full_name_en.trim()) return

    setForm((prev) => ({
      ...prev,
      slug: slugify(prev.full_name_en),
    }))
  }

  const autoGenerateClinicSlug = () => {
    if (!form.clinic_name_en.trim()) return

    setForm((prev) => ({
      ...prev,
      clinic_slug: slugify(prev.clinic_name_en),
    }))
  }

  const uploadDoctorPhotoIfNeeded = async () => {
  if (!selectedPhotoFile) {
    return form.photo_url.trim() || null
  }

  const fileExt = selectedPhotoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `doctor-${doctorId}-${Date.now()}.${fileExt}`
  const filePath = `doctors/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('doctor-photos')
    .upload(filePath, selectedPhotoFile, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload doctor photo.')
  }

  const { data: publicUrlData } = supabase.storage
    .from('doctor-photos')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl || null
}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!doctorId) {
      setErrorMessage('Doctor id is missing.')
      return
    }

    if (!form.full_name_en.trim()) {
      setErrorMessage('Doctor name in English is required.')
      return
    }

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const uploadedPhotoUrl = await uploadDoctorPhotoIfNeeded()

      const payload = {
        slug: form.slug.trim() || null,
        full_name_en: form.full_name_en.trim(),
        full_name_ar: form.full_name_ar.trim() || null,
        title_en: form.title_en.trim() || null,
        title_ar: form.title_ar.trim() || null,
        gender: form.gender || null,
        bio_en: form.bio_en.trim() || null,
        bio_ar: form.bio_ar.trim() || null,
        photo_url: uploadedPhotoUrl,
        years_of_experience:
          form.years_of_experience.trim() === ''
            ? null
            : Number(form.years_of_experience),
        consultation_fee:
          form.consultation_fee.trim() === ''
            ? null
            : Number(form.consultation_fee),
        is_featured: form.is_featured,
        is_active: form.is_active,
        phone: form.phone.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        email: form.email.trim() || null,
        clinic_name_en: form.clinic_name_en.trim() || null,
        clinic_name_ar: form.clinic_name_ar.trim() || null,
        clinic_slug: form.clinic_slug.trim() || null,
        clinic_phone: form.clinic_phone.trim() || null,
        clinic_email: form.clinic_email.trim() || null,
        clinic_website_url: form.clinic_website_url.trim() || null,
        clinic_whatsapp_number: form.clinic_whatsapp_number.trim() || null,
        clinic_address_line: form.clinic_address_line.trim() || null,
        clinic_google_maps_url: form.clinic_google_maps_url.trim() || null,
        clinic_logo_url: form.clinic_logo_url.trim() || null,
        clinic_cover_image_url: form.clinic_cover_image_url.trim() || null,
        clinic_short_description_en:
          form.clinic_short_description_en.trim() || null,
        clinic_short_description_ar:
          form.clinic_short_description_ar.trim() || null,
        clinic_full_description_en:
          form.clinic_full_description_en.trim() || null,
        clinic_full_description_ar:
          form.clinic_full_description_ar.trim() || null,
        city_id: form.city_id || null,
        specialty_subcategory_id: form.specialty_subcategory_id
          ? Number(form.specialty_subcategory_id)
          : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('health_doctors')
        .update(payload)
        .eq('id', doctorId)

      if (error) {
        setSaving(false)
        setErrorMessage(error.message || 'Failed to update doctor.')
        return
      }

      setSaving(false)
      setSuccessMessage('Doctor updated successfully.')

      setTimeout(() => {
        router.push('/admin/services/health')
        router.refresh()
      }, 900)
    } catch (error) {
      setSaving(false)
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update doctor.'
      )
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading doctor data...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Doctor</h1>
            <p className="mt-1 text-sm text-slate-500">
              Update doctor and clinic information
            </p>
          </div>

          <Link
            href="/admin/services/health"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Back
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
        >
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Doctor Information
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name (EN) *
                </label>
                <input
                  name="full_name_en"
                  value={form.full_name_en}
                  onChange={handleChange}
                  onBlur={autoGenerateDoctorSlug}
                  placeholder="Doctor full name in English"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Consultation Fee
                </label>
                <input
                  name="consultation_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.consultation_fee}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Doctor phone"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  WhatsApp Number
                </label>
                <input
                  name="whatsapp_number"
                  value={form.whatsapp_number}
                  onChange={handleChange}
                  placeholder="Doctor WhatsApp"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Doctor Photo
                </label>

                <div className="flex flex-col gap-4">
                  <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/40 p-3 shadow-sm">
                    <div className="flex min-h-[260px] flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-3">
                      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-500 bg-slate-50 px-4 py-6 text-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mb-3 h-20 w-20"
                        >
                          <path
                            d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15"
                            stroke="#000000"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-slate-800">
                          Browse File to upload!
                        </p>
                      </div>

                      <label
                        htmlFor="photo"
                        className="flex min-h-12 cursor-pointer items-center justify-end gap-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-3 py-2 text-white transition hover:from-blue-400 hover:to-blue-600"
                      >
                        <svg
                          fill="currentColor"
                          viewBox="0 0 32 32"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 min-w-6 rounded-full bg-white/20 p-0.5 shadow"
                        >
                          <path d="M15.331 6H8.5v20h15V14.154h-8.169z" />
                          <path d="M18.153 6h-.009v5.342H23.5v-.002z" />
                        </svg>

                        <p className="flex-1 truncate text-center text-sm font-semibold">
                          {selectedFileName || form.photo_url || 'Not selected file'}
                        </p>

                        {(selectedFileName || form.photo_url) ? (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center bg-transparent p-0 text-white"
                            onClick={(event) => {
                              event.preventDefault()
                              handleClearFile()
                            }}
                            aria-label="Remove Photo"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 min-w-6 rounded-full bg-white/20 p-0.5 shadow"
                            >
                              <path
                                d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M19.5 5H4.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </button>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 min-w-6 rounded-full bg-white/20 p-0.5 shadow"
                          >
                            <path
                              d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M19.5 5H4.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        )}
                      </label>

                      <input
                        ref={fileInputRef}
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {previewUrl ? (
                    <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-white to-blue-50 p-3 shadow-sm">
                      <img
                        src={previewUrl}
                        alt="Doctor preview"
                        className="block max-h-[240px] w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : form.photo_url ? (
                    <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-white to-blue-50 p-3 shadow-sm">
                      <div className="relative h-[240px] w-full overflow-hidden rounded-xl">
                        <Image
                          src={form.photo_url}
                          alt="Doctor current photo"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>
                <select
                  name="city_id"
                  value={form.city_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name_en} {city.name_ar ? `- ${city.name_ar}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Specialty
                </label>
                <select
                  name="specialty_subcategory_id"
                  value={form.specialty_subcategory_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">Select specialty</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name_en}{' '}
                      {specialty.name_ar ? `- ${specialty.name_ar}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">
                  Active doctor
                </span>
              </label>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <Link
              href="/admin/services/health"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}