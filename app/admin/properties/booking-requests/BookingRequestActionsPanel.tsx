'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptBookingRequestAction, rejectBookingRequestAction } from './actions'

type RequestedOptionCode =
  | 'single_room'
  | 'double_room'
  | 'triple_room'
  | 'full_apartment'
  | null

type PropertySellableOption = {
  id: string
  code: string
  name_en: string | null
  name_ar: string | null
  price_egp: number | null
  sell_mode: 'entire_property' | 'entire_room' | 'bed' | string
  occupancy_size: number | null
  pricing_mode: 'per_person' | 'per_room' | string | null
  is_active: boolean | null
  sort_order: number | null
}

type RoomSellableOption = {
  id: string
  room_id: string
  code: string
  name_en: string | null
  name_ar: string | null
  price_egp: number | null
  occupancy_size: number | null
  pricing_mode: 'per_person' | 'per_room' | string | null
  consumes_beds_count: number | null
  is_exclusive: boolean | null
  is_active: boolean | null
  sort_order: number | null
}

type RoomSummary = {
  id: string
  room_name: string | null
  room_name_ar: string | null
  status: 'available' | 'partially_reserved' | 'fully_reserved' | 'inactive' | string
  availableBedsCount: number
  totalBedsCount: number
  sellableOptions: RoomSellableOption[]
  currentMode: 'single_room' | 'double_room' | 'triple_room' | null
}

type Props = {
  requestId: string
  propertyId: string
  propertySellableOptions: PropertySellableOption[]
  rooms: RoomSummary[]
  requestedOptionCode?: RequestedOptionCode
  userId?: string | null
  currentWalletBalance?: number
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `EGP ${Number(value).toLocaleString()}`
}

function getRoomDisplayName(room: RoomSummary) {
  return room.room_name || room.room_name_ar || 'Unnamed room'
}

function getOptionDisplayName(option: {
  name_en: string | null
  name_ar: string | null
  code: string
}) {
  return option.name_en || option.name_ar || option.code || 'Option'
}

function getRequestedOptionLabel(requestedOptionCode?: RequestedOptionCode) {
  if (requestedOptionCode === 'single_room') return 'Single Room'
  if (requestedOptionCode === 'double_room') return 'Double Room'
  if (requestedOptionCode === 'triple_room') return 'Triple Room'
  if (requestedOptionCode === 'full_apartment') return 'Full Apartment'
  return 'Not specified'
}

function normalizeRoomOptionCode(value?: string | null) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  if (normalized === 'single_room' || normalized === 'single') return 'single_room'
  if (normalized === 'double_room' || normalized === 'double') return 'double_room'
  if (normalized === 'triple_room' || normalized === 'triple') return 'triple_room'
  if (normalized === 'full_apartment') return 'full_apartment'

  return null
}

function getRoomStatusTone(status: string) {
  if (status === 'available') return 'border-[#dbe5ff] bg-[#f3f6ff] text-[#054aff]'
  if (status === 'partially_reserved') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }
  if (status === 'fully_reserved') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (status === 'inactive') return 'border-gray-200 bg-gray-100 text-gray-500'
  return 'border-gray-200 bg-gray-50 text-gray-700'
}

export default function BookingRequestActionsPanel({
  requestId,
  propertyId,
  propertySellableOptions,
  rooms,
  requestedOptionCode = null,
  userId = null,
  currentWalletBalance = 0,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState('')

  const isFullApartmentRequest = requestedOptionCode === 'full_apartment'

  const fullApartmentOption = useMemo(() => {
    return (
      propertySellableOptions.find(
        (option) =>
          option.is_active !== false &&
          (option.code === 'full_apartment' || option.sell_mode === 'entire_property')
      ) || null
    )
  }, [propertySellableOptions])

  const eligibleRooms = useMemo(() => {
    if (isFullApartmentRequest) return []

    return rooms.filter((room) => {
      if (room.status === 'inactive' || room.status === 'fully_reserved') {
        return false
      }

      if (!requestedOptionCode) {
        return true
      }

      if (room.currentMode && room.currentMode !== requestedOptionCode) {
        return false
      }

      const activeOptions = (room.sellableOptions || []).filter(
        (option) => option.is_active !== false
      )

      const hasMatchingOption = activeOptions.some(
        (option) => normalizeRoomOptionCode(option.code) === requestedOptionCode
      )

      if (!hasMatchingOption) {
        return false
      }

      if (requestedOptionCode === 'single_room') {
        return room.status === 'available' && room.availableBedsCount === room.totalBedsCount
      }

      if (
        requestedOptionCode === 'double_room' ||
        requestedOptionCode === 'triple_room'
      ) {
        return room.availableBedsCount > 0
      }

      return true
    })
  }, [rooms, isFullApartmentRequest, requestedOptionCode])

  const [selectedRoomId, setSelectedRoomId] = useState('')

  useEffect(() => {
    if (eligibleRooms.length === 1) {
      setSelectedRoomId(eligibleRooms[0].id)
      return
    }

    if (selectedRoomId && !eligibleRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId('')
    }
  }, [eligibleRooms, selectedRoomId])

  const selectedRoom = useMemo(() => {
    return eligibleRooms.find((room) => room.id === selectedRoomId) || null
  }, [eligibleRooms, selectedRoomId])

  const filteredRoomOptions = useMemo(() => {
    if (!selectedRoom || isFullApartmentRequest) return []

    return [...(selectedRoom.sellableOptions || [])]
      .filter((option) => {
        if (option.is_active === false) return false
        if (!requestedOptionCode) return true

        return normalizeRoomOptionCode(option.code) === requestedOptionCode
      })
      .sort((a, b) => {
        const orderA = a.sort_order ?? 0
        const orderB = b.sort_order ?? 0
        return orderA - orderB
      })
  }, [selectedRoom, requestedOptionCode, isFullApartmentRequest])

  const [selectedRoomSellableOptionId, setSelectedRoomSellableOptionId] = useState('')

  useEffect(() => {
    if (filteredRoomOptions.length > 0) {
      const firstOption = filteredRoomOptions[0]

      if (
        !selectedRoomSellableOptionId ||
        !filteredRoomOptions.some((option) => option.id === selectedRoomSellableOptionId)
      ) {
        setSelectedRoomSellableOptionId(firstOption.id)
      }
      return
    }

    if (selectedRoomSellableOptionId) {
      setSelectedRoomSellableOptionId('')
    }
  }, [filteredRoomOptions, selectedRoomSellableOptionId])

  const selectedRoomOption = useMemo(() => {
    return (
      filteredRoomOptions.find((option) => option.id === selectedRoomSellableOptionId) ||
      null
    )
  }, [filteredRoomOptions, selectedRoomSellableOptionId])

  const calculatedTotalPrice = useMemo(() => {
    if (isFullApartmentRequest) {
      return fullApartmentOption?.price_egp ?? null
    }

    if (selectedRoomOption?.price_egp != null) {
      return selectedRoomOption.price_egp
    }

    return null
  }, [isFullApartmentRequest, selectedRoomOption, fullApartmentOption])

  const requiredWalletAmount = useMemo(() => {
    if (typeof calculatedTotalPrice !== 'number' || calculatedTotalPrice <= 0) return 0
    return calculatedTotalPrice
  }, [calculatedTotalPrice])

  const hasSufficientWalletBalance = useMemo(() => {
    if (!userId) return false
    if (requiredWalletAmount <= 0) return false
    return currentWalletBalance >= requiredWalletAmount
  }, [userId, currentWalletBalance, requiredWalletAmount])

  const isAcceptDisabled =
    isPending ||
    !userId ||
    typeof calculatedTotalPrice !== 'number' ||
    calculatedTotalPrice <= 0 ||
    !hasSufficientWalletBalance

  const handleReject = () => {
    setErrorMessage('')

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('request_id', requestId)
        await rejectBookingRequestAction(formData)
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
      }
    })
  }

  const appendWalletFields = (formData: FormData) => {
    formData.set('use_wallet_balance', 'true')
    formData.set('wallet_amount_to_use', String(requiredWalletAmount))
  }

  const handleAccept = () => {
    setErrorMessage('')

    if (!userId) {
      setErrorMessage(
        'This request cannot be accepted because it is not linked to a user account with a wallet.'
      )
      return
    }

    if (typeof calculatedTotalPrice !== 'number' || calculatedTotalPrice <= 0) {
      setErrorMessage('Total price must be available before accepting the request.')
      return
    }

    if (!hasSufficientWalletBalance) {
      setErrorMessage(
        'Insufficient wallet balance. The wallet must cover 100% of the reservation amount.'
      )
      return
    }

    if (isFullApartmentRequest) {
      if (!fullApartmentOption?.id) {
        setErrorMessage('Full apartment option was not found.')
        return
      }

      startTransition(async () => {
        try {
          const formData = new FormData()
          formData.set('request_id', requestId)
          formData.set('property_id', propertyId)
          formData.set('requested_option_code', 'full_apartment')
          formData.set('reservation_scope', 'entire_property')
          formData.set('sellable_option_id', fullApartmentOption.id)

          if (fullApartmentOption.price_egp != null) {
            formData.set('total_price_egp', String(fullApartmentOption.price_egp))
          }

          appendWalletFields(formData)

          await acceptBookingRequestAction(formData)
          router.refresh()
        } catch (error: any) {
          setErrorMessage(error.message || 'Something went wrong')
        }
      })

      return
    }

    if (!selectedRoomId) {
      setErrorMessage('Please select a room first.')
      return
    }

    if (!selectedRoomSellableOptionId) {
      setErrorMessage('Please select a room option first.')
      return
    }

    if (!selectedRoomOption) {
      setErrorMessage('Selected room option was not found.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('request_id', requestId)
        formData.set('property_id', propertyId)
        formData.set('room_id', selectedRoomId)
        formData.set('room_sellable_option_id', selectedRoomSellableOptionId)

        if (requestedOptionCode) {
          formData.set('requested_option_code', requestedOptionCode)
        }

        const normalizedCode = normalizeRoomOptionCode(selectedRoomOption.code)

        if (normalizedCode === 'double_room' || normalizedCode === 'triple_room') {
          formData.set('reservation_scope', 'beds')
          formData.set('reserved_units_count', '1')
        } else if (normalizedCode === 'single_room') {
          formData.set('reservation_scope', 'entire_room')
          formData.set('reserved_units_count', '1')
        } else {
          formData.set('reservation_scope', 'entire_room')
        }

        if (selectedRoomOption.price_egp != null) {
          formData.set('total_price_egp', String(selectedRoomOption.price_egp))
        }

        appendWalletFields(formData)

        await acceptBookingRequestAction(formData)
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-black/5 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] sm:p-4">
        <div className="relative overflow-hidden rounded-[20px] border border-[#dbe5ff] bg-gradient-to-l from-[#08152f] via-[#0b1f46] to-[#123a8f] px-4 py-4 text-white shadow-[0_12px_30px_rgba(8,21,47,0.16)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-20 w-20 rounded-full bg-[#6ea8ff]/20 blur-2xl" />
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-bold tracking-tight text-white">
              {getRequestedOptionLabel(requestedOptionCode)}
            </h3>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {isFullApartmentRequest ? (
            <div className="grid gap-3 sm:grid-cols-1">
              <div className="rounded-[18px] border border-black/5 bg-[#f3f6ff] p-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#054aff]">
                  Full Apartment Option
                </label>
                <div className="mt-2 rounded-[16px] border border-white/70 bg-white px-3 py-3 shadow-[0_6px_18px_rgba(5,74,255,0.06)]">
                  <p className="text-sm font-bold text-gray-900">
                    {fullApartmentOption
                      ? getOptionDisplayName(fullApartmentOption)
                      : 'Full apartment option not found'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {fullApartmentOption
                      ? formatPrice(fullApartmentOption.price_egp)
                      : 'No price available'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[18px] border border-black/5 bg-[#f8faff] p-3">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#054aff]">
                  Room
                </label>

                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value)
                    setSelectedRoomSellableOptionId('')
                  }}
                  className="w-full rounded-[16px] border border-[#dbe5ff] bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#054aff]"
                >
                  <option value="">Select room</option>
                  {eligibleRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {getRoomDisplayName(room)} — {room.availableBedsCount} available beds
                    </option>
                  ))}
                </select>

                {eligibleRooms.length > 0 ? (
                  <div className="mt-3 grid gap-2.5">
                    {eligibleRooms.map((room) => {
                      const isSelected = selectedRoomId === room.id

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => {
                            setSelectedRoomId(room.id)
                            setSelectedRoomSellableOptionId('')
                          }}
                          className={`rounded-[18px] border p-3 text-left transition ${
                            isSelected
                              ? 'border-[#054aff] bg-[#eef4ff] shadow-[0_8px_18px_rgba(5,74,255,0.10)]'
                              : 'border-black/5 bg-white hover:border-[#cdddff] hover:bg-[#fbfcff]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">
                                {getRoomDisplayName(room)}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {room.availableBedsCount}/{room.totalBedsCount} beds available
                              </p>
                            </div>

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getRoomStatusTone(
                                room.status
                              )}`}
                            >
                              {room.status.replaceAll('_', ' ')}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[16px] border border-dashed border-black/10 bg-white px-3 py-2.5 text-sm text-gray-500">
                    No eligible rooms available for this requested option.
                  </div>
                )}
              </div>
            </>
          )}

          <div className="rounded-[18px] bg-[#f3f6ff] p-3 shadow-[0_10px_24px_rgba(5,74,255,0.10)]">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-[16px] border border-white/70 bg-white px-3 py-3 shadow-[0_6px_18px_rgba(5,74,255,0.06)]">
                <p className="text-[11px] text-gray-500">Current wallet balance</p>
                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {userId ? formatPrice(currentWalletBalance) : 'No linked user'}
                </p>
              </div>

              <div className="rounded-[16px] border border-white/70 bg-white px-3 py-3 shadow-[0_6px_18px_rgba(5,74,255,0.06)]">
                <p className="text-[11px] text-gray-500">Required wallet payment</p>
                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {formatPrice(requiredWalletAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={isAcceptDisabled}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#054aff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0437bf] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
    </div>
  )
}