'use client'

import { useMemo, useRef, useState } from 'react'

type PropertyImage = {
  id?: string
  image_url?: string | null
  is_cover?: boolean | null
  sort_order?: number | null
  storage_path?: string | null
}

type ExistingGalleryItem = {
  kind: 'existing'
  id: string
  image_url: string
}

type NewGalleryItem = {
  kind: 'new'
  tempId: string
  file: File
  previewUrl: string
}

type GalleryItem = ExistingGalleryItem | NewGalleryItem

export default function PropertyGalleryEditor({
  initialImages,
  saveButtonClass,
}: {
  initialImages: PropertyImage[]
  saveButtonClass: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(
    (initialImages || [])
      .filter((image) => image.id && image.image_url)
      .map((image) => ({
        kind: 'existing',
        id: String(image.id),
        image_url: String(image.image_url),
      }))
  )

  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([])

  const visibleImagesCount = galleryItems.length

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])

    if (selectedFiles.length === 0) return

    const newItems: NewGalleryItem[] = selectedFiles.map((file, index) => ({
      kind: 'new',
      tempId: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setGalleryItems((prev) => [...prev, ...newItems])

    const dt = new DataTransfer()
    const currentNewFiles = [...galleryItems]
      .filter((item): item is NewGalleryItem => item.kind === 'new')
      .map((item) => item.file)

    ;[...currentNewFiles, ...selectedFiles].forEach((file) => {
      dt.items.add(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files
    }
  }

  const handleDeleteImage = (item: GalleryItem) => {
    if (item.kind === 'existing') {
      setRemovedExistingIds((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id]
      )

      setGalleryItems((prev) =>
        prev.filter((galleryItem) => !(galleryItem.kind === 'existing' && galleryItem.id === item.id))
      )

      return
    }

    URL.revokeObjectURL(item.previewUrl)

    const nextItems = galleryItems.filter(
      (galleryItem) => !(galleryItem.kind === 'new' && galleryItem.tempId === item.tempId)
    )

    setGalleryItems(nextItems)

    const remainingNewFiles = nextItems
      .filter((galleryItem): galleryItem is NewGalleryItem => galleryItem.kind === 'new')
      .map((galleryItem) => galleryItem.file)

    const dt = new DataTransfer()
    remainingNewFiles.forEach((file) => {
      dt.items.add(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files
    }
  }

  const galleryCards = useMemo(() => galleryItems, [galleryItems])

  return (
    <>
      {removedExistingIds.map((id) => (
        <input key={id} type="hidden" name="remove_image_ids" value={id} />
      ))}

      <div className="rounded-[24px] border border-dashed border-blue-200 bg-blue-50/40 p-5">
        <div className="text-base font-semibold text-[#111827]">
          Upload New Images
        </div>

        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-[#111827] file:mr-4 file:rounded-[14px] file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 text-base font-semibold text-[#111827]">
          Current Images
        </div>

        {visibleImagesCount > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {galleryCards.map((item, index) => {
              const imageUrl =
                item.kind === 'existing' ? item.image_url : item.previewUrl

              const isNew = item.kind === 'new'

              return (
                <div
                  key={item.kind === 'existing' ? item.id : item.tempId}
                  className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full bg-[#f5f5f5]">
                    <img
                      src={imageUrl}
                      alt={`Property image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {index === 0 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        Cover
                      </span>
                    ) : null}

                    {isNew ? (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        New
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827]">
                        Image {index + 1}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {isNew ? 'Ready to upload' : 'Existing image'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(item)}
                      className="inline-flex shrink-0 items-center justify-center rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#fafafa] px-5 py-8 text-sm text-gray-500">
            No images uploaded yet.
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" className={saveButtonClass}>
          Save Gallery Changes
        </button>
      </div>
    </>
  )
}