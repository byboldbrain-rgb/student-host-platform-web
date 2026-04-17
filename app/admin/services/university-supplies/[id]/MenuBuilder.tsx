'use client'

import { useEffect, useMemo, useState } from 'react'

type MenuCategory = {
  id: number
  restaurant_id: number
  name_en: string
  name_ar: string
  sort_order?: number | null
}

type MenuItemVariant = {
  id: number
  menu_item_id: number
  name_en: string
  name_ar?: string | null
  price?: number | null
  compare_at_price?: number | null
  discount_percentage?: number | null
  sku?: string | null
  is_default?: boolean | null
  is_available?: boolean | null
  sort_order?: number | null
}

type MenuItem = {
  id: number
  restaurant_id: number
  menu_category_id: number
  name_en: string
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  price?: number | null
  image_url?: string | null
  is_available?: boolean | null
  sort_order?: number | null
  restaurant_menu_item_variants?: MenuItemVariant[] | null
}

function createTempId() {
  return Date.now() + Math.floor(Math.random() * 100000)
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function calculateDiscountedPrice(
  compareAtPrice?: number | null,
  discountPercentage?: number | null
) {
  const basePrice = Number(compareAtPrice ?? 0)
  const discount = Number(discountPercentage ?? 0)

  if (!basePrice || basePrice <= 0) return 0

  const safeDiscount = Math.min(Math.max(discount, 0), 100)
  const finalPrice = basePrice - basePrice * (safeDiscount / 100)

  return Number(finalPrice.toFixed(2))
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

function Textarea({
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    />
  )
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-[#d0d5dd] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#175cd3] focus:ring-4 focus:ring-[#dbeafe] ${
        props.className || ''
      }`}
    >
      {children}
    </select>
  )
}

function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50 ${
        props.className || ''
      }`}
    >
      {children}
    </button>
  )
}

function DangerButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl border border-[#fecdca] bg-white px-4 py-2.5 text-sm font-semibold text-[#d92d20] transition hover:bg-[#fef3f2] ${
        props.className || ''
      }`}
    >
      {children}
    </button>
  )
}

function CategoryBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[#f2f4f7] px-2 py-1 text-[11px] font-bold text-[#475467]">
      {count}
    </span>
  )
}

export default function MenuBuilder({
  providerId,
  categories,
  setCategories,
  items,
  setItems,
  itemImageFiles,
  setItemImageFiles,
}: {
  providerId: number
  categories: MenuCategory[]
  setCategories: React.Dispatch<React.SetStateAction<MenuCategory[]>>
  items: MenuItem[]
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>
  itemImageFiles: Record<number, File | null>
  setItemImageFiles: React.Dispatch<React.SetStateAction<Record<number, File | null>>>
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(items[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<number[]>([])

  const [dirtyToken, setDirtyToken] = useState(0)
  const [savedDirtyToken, setSavedDirtyToken] = useState(0)

  const [itemImagePreviews, setItemImagePreviews] = useState<Record<number, string>>({})

  useEffect(() => {
    setSavedDirtyToken(dirtyToken)
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemId(null)
      return
    }

    const exists = items.some((item) => item.id === selectedItemId)
    if (!exists) {
      setSelectedItemId(items[0].id)
    }
  }, [items, selectedItemId])

  useEffect(() => {
    if (selectedCategoryId === 'all') return

    const categoryStillExists = categories.some((cat) => cat.id === selectedCategoryId)
    if (!categoryStillExists) {
      setSelectedCategoryId('all')
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    return () => {
      Object.values(itemImagePreviews).forEach((url) => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [itemImagePreviews])

  const markDirty = () => setDirtyToken((prev) => prev + 1)

  const groupedItems = useMemo(() => {
    const q = search.trim().toLowerCase()

    const grouped = categories.map((category) => {
      const categoryItems = items.filter((item) => item.menu_category_id === category.id)

      const filtered = categoryItems.filter((item) => {
        const matchesSearch =
          !q ||
          item.name_en?.toLowerCase().includes(q) ||
          item.name_ar?.toLowerCase().includes(q) ||
          category.name_en?.toLowerCase().includes(q) ||
          category.name_ar?.toLowerCase().includes(q)

        const matchesSelectedCategory =
          selectedCategoryId === 'all' || selectedCategoryId === category.id

        return matchesSearch && matchesSelectedCategory
      })

      return {
        category,
        items: filtered,
        totalCount: categoryItems.length,
      }
    })

    if (selectedCategoryId === 'all') return grouped

    return grouped.filter((group) => group.category.id === selectedCategoryId)
  }, [categories, items, search, selectedCategoryId])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId]
  )

  const hasUnsavedLocalChanges = dirtyToken !== savedDirtyToken

  const toggleCategoryCollapse = (categoryId: number) => {
    setCollapsedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const addCategory = () => {
    const newCategory: MenuCategory = {
      id: createTempId(),
      restaurant_id: providerId,
      name_en: '',
      name_ar: '',
      sort_order: categories.length,
    }

    setCategories((prev) => [...prev, newCategory])
    setSelectedCategoryId(newCategory.id)
    markDirty()
  }

  const removeCategory = (categoryId: number) => {
    const removedItemIds = items
      .filter((item) => item.menu_category_id === categoryId)
      .map((item) => item.id)

    setCategories((prev) => prev.filter((category) => category.id !== categoryId))

    setItems((prev) => {
      const next = prev.filter((item) => item.menu_category_id !== categoryId)

      if (selectedItemId && !next.some((item) => item.id === selectedItemId)) {
        setSelectedItemId(next[0]?.id ?? null)
      }

      return next
    })

    setItemImageFiles((prev) => {
      const next = { ...prev }
      removedItemIds.forEach((itemId) => {
        delete next[itemId]
      })
      return next
    })

    setItemImagePreviews((prev) => {
      const next = { ...prev }

      removedItemIds.forEach((itemId) => {
        const previewUrl = next[itemId]
        if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        delete next[itemId]
      })

      return next
    })

    markDirty()
  }

  const updateCategory = (
    index: number,
    key: keyof MenuCategory,
    value: string | number | null
  ) => {
    setCategories((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    )
    markDirty()
  }

  const addItem = () => {
    const fallbackCategoryId =
      selectedCategoryId !== 'all' ? selectedCategoryId : categories[0]?.id || 0

    const newItem: MenuItem = {
      id: createTempId(),
      restaurant_id: providerId,
      menu_category_id: fallbackCategoryId,
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      image_url: null,
      is_available: true,
      sort_order: items.length,
      restaurant_menu_item_variants: [],
    }

    setItems((prev) => [...prev, newItem])
    setSelectedItemId(newItem.id)
    markDirty()
  }

  const duplicateItem = (itemId: number) => {
    const source = items.find((item) => item.id === itemId)
    if (!source) return

    const duplicatedId = createTempId()

    const duplicated: MenuItem = {
      ...source,
      id: duplicatedId,
      name_en: source.name_en ? `${source.name_en} Copy` : '',
      restaurant_menu_item_variants: (source.restaurant_menu_item_variants || []).map(
        (variant, index) => ({
          ...variant,
          id: createTempId() + index,
          menu_item_id: duplicatedId,
          is_default: variant.is_default === true,
        })
      ),
    }

    setItems((prev) => [...prev, duplicated])

    if (itemImageFiles[itemId]) {
      setItemImageFiles((prev) => ({
        ...prev,
        [duplicatedId]: prev[itemId],
      }))
    }

    if (itemImagePreviews[itemId]) {
      setItemImagePreviews((prev) => ({
        ...prev,
        [duplicatedId]: prev[itemId],
      }))
    }

    setSelectedItemId(duplicated.id)
    markDirty()
  }

  const moveItem = (itemId: number, direction: 'up' | 'down') => {
    setItems((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === itemId)
      if (currentIndex === -1) return prev

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const currentItem = prev[currentIndex]
      const targetItem = prev[targetIndex]

      if (currentItem.menu_category_id !== targetItem.menu_category_id) return prev

      const next = [...prev]
      ;[next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]]

      return next.map((item, index) => ({
        ...item,
        sort_order: index,
      }))
    })

    markDirty()
  }

  const removeItem = (itemId: number) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId)
      setSelectedItemId(next[0]?.id ?? null)
      return next
    })

    setItemImageFiles((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })

    setItemImagePreviews((prev) => {
      const next = { ...prev }
      const previewUrl = next[itemId]
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      delete next[itemId]
      return next
    })

    markDirty()
  }

  const updateItemById = (
    itemId: number,
    key: keyof MenuItem,
    value: string | number | boolean | null
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [key]: value } : item))
    )
    markDirty()
  }

  const handleItemImageChange = (itemId: number, file: File | null) => {
    const currentPreview = itemImagePreviews[itemId]

    if (currentPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview)
    }

    if (!file) {
      setItemImageFiles((prev) => ({
        ...prev,
        [itemId]: null,
      }))

      setItemImagePreviews((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })

      updateItemById(itemId, 'image_url', null)
      return
    }

    const previewUrl = URL.createObjectURL(file)

    setItemImageFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }))

    setItemImagePreviews((prev) => ({
      ...prev,
      [itemId]: previewUrl,
    }))

    markDirty()
  }

  const addVariant = (itemId: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          restaurant_menu_item_variants: [
            ...(item.restaurant_menu_item_variants || []),
            {
              id: createTempId(),
              menu_item_id: item.id,
              name_en: '',
              name_ar: '',
              price: 0,
              compare_at_price: null,
              discount_percentage: null,
              sku: '',
              is_default: (item.restaurant_menu_item_variants || []).length === 0,
              is_available: true,
              sort_order: (item.restaurant_menu_item_variants || []).length,
            },
          ],
        }
      })
    )
    markDirty()
  }

  const duplicateVariant = (itemId: number, variantIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        const variants = item.restaurant_menu_item_variants || []
        const source = variants[variantIndex]
        if (!source) return item

        return {
          ...item,
          restaurant_menu_item_variants: [
            ...variants,
            {
              ...source,
              id: createTempId(),
              name_en: source.name_en ? `${source.name_en} Copy` : '',
              is_default: false,
              sort_order: variants.length,
            },
          ],
        }
      })
    )
    markDirty()
  }

  const removeVariant = (itemId: number, variantIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        const nextVariants = (item.restaurant_menu_item_variants || []).filter(
          (_, vi) => vi !== variantIndex
        )

        const hasDefault = nextVariants.some((variant) => variant.is_default === true)

        return {
          ...item,
          restaurant_menu_item_variants: nextVariants.map((variant, vi) => ({
            ...variant,
            sort_order: vi,
            is_default: hasDefault ? variant.is_default : vi === 0,
          })),
        }
      })
    )
    markDirty()
  }

  const updateVariant = (
    itemId: number,
    variantIndex: number,
    key: keyof MenuItemVariant,
    value: string | number | boolean | null
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        const currentVariants = item.restaurant_menu_item_variants || []

        const updatedVariants = currentVariants.map((variant, vi) => {
          if (vi !== variantIndex) {
            if (key === 'is_default' && value === true) {
              return { ...variant, is_default: false }
            }
            return variant
          }

          const updatedVariant: MenuItemVariant = {
            ...variant,
            [key]: value,
          }

          if (key === 'compare_at_price' || key === 'discount_percentage') {
            updatedVariant.price = calculateDiscountedPrice(
              key === 'compare_at_price'
                ? (value as number | null)
                : updatedVariant.compare_at_price,
              key === 'discount_percentage'
                ? (value as number | null)
                : updatedVariant.discount_percentage
            )
          }

          return updatedVariant
        })

        return {
          ...item,
          restaurant_menu_item_variants: updatedVariants,
        }
      })
    )
    markDirty()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#101828]">Catalog Builder</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Manage university supplies categories, products, and variants in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
              hasUnsavedLocalChanges
                ? 'bg-[#fffaeb] text-[#b54708]'
                : 'bg-[#ecfdf3] text-[#027a48]'
            )}
          >
            {hasUnsavedLocalChanges ? 'Unsaved local changes' : 'All local edits tracked'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-[24px] border border-[#eaecf0] bg-[#fcfcfd] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <SecondaryButton type="button" onClick={addCategory}>
                + Category
              </SecondaryButton>
            </div>

            <div className="mb-3 space-y-3">
              <Input
                placeholder="Search products or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select
                value={selectedCategoryId === 'all' ? 'all' : String(selectedCategoryId)}
                onChange={(e) =>
                  setSelectedCategoryId(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_en || category.name_ar || 'Untitled Category'}
                  </option>
                ))}
              </Select>
            </div>

            <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
              {groupedItems.map(({ category, items: categoryItems, totalCount }) => {
                const collapsed = collapsedCategoryIds.includes(category.id)
                const isCategoryFocused =
                  selectedCategoryId === 'all' || selectedCategoryId === category.id

                return (
                  <div
                    key={category.id}
                    className={cn(
                      'rounded-[22px] border p-3 transition',
                      isCategoryFocused
                        ? 'border-[#dbeafe] bg-white'
                        : 'border-[#e4e7ec] bg-white'
                    )}
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(category.id)}
                        className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-xs text-[#475467]"
                      >
                        {collapsed ? '▸' : '▾'}
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-[#101828]">
                              {category.name_en || category.name_ar || 'Untitled Category'}
                            </p>
                            <CategoryBadge count={totalCount} />
                          </div>
                        </button>

                        <div className="mt-3 space-y-2">
                          <Input
                            placeholder="Category EN"
                            value={category.name_en || ''}
                            onChange={(e) => {
                              const index = categories.findIndex((c) => c.id === category.id)
                              if (index >= 0) updateCategory(index, 'name_en', e.target.value)
                            }}
                          />

                          <DangerButton
                            type="button"
                            className="w-full"
                            onClick={() => removeCategory(category.id)}
                          >
                            Delete Category
                          </DangerButton>
                        </div>
                      </div>
                    </div>

                    {!collapsed ? (
                      <div className="space-y-2 border-t border-[#f2f4f7] pt-3">
                        {categoryItems.map((item, index) => {
                          const isActive = item.id === selectedItemId

                          return (
                            <button
                              key={`${item.id}-${index}`}
                              type="button"
                              onClick={() => setSelectedItemId(item.id)}
                              className={cn(
                                'w-full rounded-2xl border px-3 py-3 text-left transition',
                                isActive
                                  ? 'border-[#bfd6ff] bg-[#f5f9ff]'
                                  : 'border-[#eaecf0] bg-[#fcfcfd] hover:bg-[#f9fafb]'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#101828]">
                                    {item.name_en || item.name_ar || 'Untitled Product'}
                                  </p>
                                  <p className="mt-1 text-xs text-[#667085]">
                                    {item.price ? `${item.price}` : '0'} base price
                                  </p>
                                </div>

                                <span
                                  className={cn(
                                    'shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                                    item.is_available !== false
                                      ? 'bg-[#ecfdf3] text-[#027a48]'
                                      : 'bg-[#f2f4f7] text-[#475467]'
                                  )}
                                >
                                  {item.is_available !== false ? 'Live' : 'Hidden'}
                                </span>
                              </div>
                            </button>
                          )
                        })}

                        {categoryItems.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-6 text-center text-sm text-[#667085]">
                            No matching products in this category.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {groupedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-white px-4 py-8 text-center text-sm text-[#667085]">
                  No categories found.
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <SecondaryButton
                type="button"
                className="w-full"
                onClick={addItem}
                disabled={categories.length === 0}
              >
                + Add New Product
              </SecondaryButton>
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-[24px] border border-[#eaecf0] bg-[#fcfcfd] p-5 md:p-6">
          {selectedItem ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={selectedItem.menu_category_id || ''}
                    onChange={(e) =>
                      updateItemById(
                        selectedItem.id,
                        'menu_category_id',
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_en || category.name_ar || 'Untitled Category'}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <FieldLabel>Base Price</FieldLabel>
                  <Input
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedItem.price ?? ''}
                    onChange={(e) =>
                      updateItemById(
                        selectedItem.id,
                        'price',
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Product Name EN</FieldLabel>
                  <Input
                    placeholder="English product name"
                    value={selectedItem.name_en || ''}
                    onChange={(e) =>
                      updateItemById(selectedItem.id, 'name_en', e.target.value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Product Name AR</FieldLabel>
                  <Input
                    placeholder="Arabic product name"
                    value={selectedItem.name_ar || ''}
                    onChange={(e) =>
                      updateItemById(selectedItem.id, 'name_ar', e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Description EN</FieldLabel>
                  <Textarea
                    placeholder="English description"
                    value={selectedItem.description_en || ''}
                    onChange={(e) =>
                      updateItemById(selectedItem.id, 'description_en', e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Description AR</FieldLabel>
                  <Textarea
                    placeholder="Arabic description"
                    value={selectedItem.description_ar || ''}
                    onChange={(e) =>
                      updateItemById(selectedItem.id, 'description_ar', e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Product Image</FieldLabel>

                  <div className="space-y-4 rounded-[20px] border border-[#eaecf0] bg-white p-4">
                    <input
                      id={`item-image-${selectedItem.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleItemImageChange(selectedItem.id, file)
                      }}
                      className="block w-full text-sm text-[#344054] file:mr-4 file:rounded-xl file:border-0 file:bg-[#175cd3] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1849a9]"
                    />

                    {(itemImagePreviews[selectedItem.id] || selectedItem.image_url) ? (
                      <div className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-[#f9fafb]">
                        <img
                          src={itemImagePreviews[selectedItem.id] || selectedItem.image_url || ''}
                          alt={selectedItem.name_en || 'Product image'}
                          className="h-56 w-full object-cover"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#101828]">
                              {itemImageFiles[selectedItem.id]?.name || 'Current image'}
                            </p>

                            {itemImageFiles[selectedItem.id] ? (
                              <p className="mt-1 text-xs text-[#667085]">
                                {Math.round(itemImageFiles[selectedItem.id]!.size / 1024)} KB
                              </p>
                            ) : null}
                          </div>

                          <DangerButton
                            type="button"
                            onClick={() => handleItemImageChange(selectedItem.id, null)}
                          >
                            Remove Image
                          </DangerButton>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-8 text-center text-sm text-[#667085]">
                        No image selected yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#eaecf0] bg-white p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-[#344054]">
                  <input
                    type="checkbox"
                    checked={selectedItem.is_available !== false}
                    onChange={(e) =>
                      updateItemById(selectedItem.id, 'is_available', e.target.checked)
                    }
                  />
                  Available
                </label>
              </div>

              <div className="rounded-[20px] border border-[#eaecf0] bg-white p-4 md:p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#101828]">Variants</h4>
                  </div>

                  <SecondaryButton
                    type="button"
                    onClick={() => addVariant(selectedItem.id)}
                  >
                    + Add Variant
                  </SecondaryButton>
                </div>

                <div className="space-y-4">
                  {(selectedItem.restaurant_menu_item_variants || []).map(
                    (variant, variantIndex) => (
                      <div
                        key={`${variant.id}-${variantIndex}`}
                        className="rounded-[18px] border border-[#e4e7ec] bg-[#fcfcfd] p-4"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#101828]">
                            Variant #{variantIndex + 1}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <SecondaryButton
                              type="button"
                              onClick={() => duplicateVariant(selectedItem.id, variantIndex)}
                            >
                              Duplicate
                            </SecondaryButton>

                            <DangerButton
                              type="button"
                              onClick={() => removeVariant(selectedItem.id, variantIndex)}
                            >
                              Delete
                            </DangerButton>
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <FieldLabel>Variant Name EN</FieldLabel>
                            <Input
                              placeholder="English variant name"
                              value={variant.name_en || ''}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'name_en',
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Variant Name AR</FieldLabel>
                            <Input
                              placeholder="Arabic variant name"
                              value={variant.name_ar || ''}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'name_ar',
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Price</FieldLabel>
                            <Input
                              placeholder="Auto calculated"
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.price ?? ''}
                              readOnly
                            />
                          </div>

                          <div>
                            <FieldLabel>Compare At Price</FieldLabel>
                            <Input
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.compare_at_price ?? ''}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'compare_at_price',
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Discount %</FieldLabel>
                            <Input
                              placeholder="Enter discount percentage"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={variant.discount_percentage ?? ''}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'discount_percentage',
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>SKU</FieldLabel>
                            <Input
                              placeholder="Enter SKU"
                              value={variant.sku ?? ''}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'sku',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-6 rounded-[18px] border border-[#eaecf0] bg-white p-4">
                          <label className="flex items-center gap-3 text-sm font-medium text-[#344054]">
                            <input
                              type="checkbox"
                              checked={variant.is_default === true}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'is_default',
                                  e.target.checked
                                )
                              }
                            />
                            Default Variant
                          </label>

                          <label className="flex items-center gap-3 text-sm font-medium text-[#344054]">
                            <input
                              type="checkbox"
                              checked={variant.is_available !== false}
                              onChange={(e) =>
                                updateVariant(
                                  selectedItem.id,
                                  variantIndex,
                                  'is_available',
                                  e.target.checked
                                )
                              }
                            />
                            Available
                          </label>
                        </div>
                      </div>
                    )
                  )}

                  {(selectedItem.restaurant_menu_item_variants || []).length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-[#d0d5dd] bg-white px-6 py-8 text-center text-sm text-[#667085]">
                      No variants yet. You can keep the base price only or add variants.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-[20px] border border-dashed border-[#d0d5dd] bg-white px-6 text-center">
              <div>
                <h3 className="text-lg font-semibold text-[#101828]">No product selected</h3>
                <p className="mt-2 text-sm text-[#667085]">
                  Add a new product or choose one from the left panel to start editing.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}