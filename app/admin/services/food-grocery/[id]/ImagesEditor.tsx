'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

type ServiceAsset = {
  id: number
  provider_id: number
  asset_type: string
  title?: string | null
  file_url: string
  file_mime_type?: string | null
  sort_order?: number | null
  is_active?: boolean | null
}

function buildFilePath(
  providerId: number,
  kind: 'logo' | 'cover' | 'gallery',
  file: File
) {
  const safeName = file.name.replace(/\s+/g, '-')
  const timestamp = Date.now()

  if (kind === 'logo') {
    return `providers/${providerId}/logo/${timestamp}-${safeName}`
  }

  if (kind === 'cover') {
    return `providers/${providerId}/cover/${timestamp}-${safeName}`
  }

  return `providers/${providerId}/gallery/${timestamp}-${safeName}`
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-[#344054]">{children}</label>
}

function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    />
  )
}

function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb] disabled:opacity-50 ${
        props.className || ''
      }`}
    >
      {children}
    </button>
  )
}

export default function ImagesEditor({
  providerId,
  logoUrl,
  setLogoUrl,
  coverUrl,
  setCoverUrl,
  gallery,
  setGallery,
}: {
  providerId: number
  logoUrl: string
  setLogoUrl: (value: string) => void
  coverUrl: string
  setCoverUrl: (value: string) => void
  gallery: ServiceAsset[]
  setGallery: React.Dispatch<React.SetStateAction<ServiceAsset[]>>
}) {
  const supabase = createClient()

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const uploadSingleFile = async (
    file: File,
    kind: 'logo' | 'cover' | 'gallery'
  ) => {
    const filePath = buildFilePath(providerId, kind, file)

    const { error: uploadError } = await supabase.storage
      .from('food-grocery')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('food-grocery').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true)
      setMessage('')
      const publicUrl = await uploadSingleFile(file, 'logo')

      setLogoUrl(publicUrl)
      setCoverUrl(publicUrl)

      setMessage('Logo uploaded successfully and applied as cover image.')
    } catch (error: any) {
      setMessage(error?.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (files: FileList) => {
    try {
      setUploading(true)
      setMessage('')

      const uploaded: ServiceAsset[] = []

      for (const file of Array.from(files)) {
        const publicUrl = await uploadSingleFile(file, 'gallery')

        uploaded.push({
          id: Date.now() + Math.floor(Math.random() * 100000),
          provider_id: providerId,
          asset_type: 'gallery',
          title: file.name,
          file_url: publicUrl,
          file_mime_type: file.type || null,
          sort_order: gallery.length + uploaded.length,
          is_active: true,
        })
      }

      setGallery((prev) => [...prev, ...uploaded])
      setMessage('Gallery images uploaded successfully.')
    } catch (error: any) {
      setMessage(error?.message || 'Failed to upload gallery images')
    } finally {
      setUploading(false)
    }
  }

  const updateGallery = (index: number, key: keyof ServiceAsset, value: any) => {
    setGallery((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    )
  }

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1">
        <div className="rounded-[24px] border border-[#eaecf0] bg-[#fcfcfd] p-5">
          <FieldLabel>Logo</FieldLabel>

          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-52 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-52 w-full items-center justify-center rounded-2xl border border-dashed border-[#d0d5dd] bg-white text-sm text-[#98a2b3]">
              No logo uploaded
            </div>
          )}

          <div className="mt-4">
            <SecondaryButton
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              Upload Logo
            </SecondaryButton>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
              }}
            />
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-[#667085]">{message}</p> : null}
    </div>
  )
}