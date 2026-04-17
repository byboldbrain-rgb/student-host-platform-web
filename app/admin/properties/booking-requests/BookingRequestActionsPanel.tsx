'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptBookingRequestAction,
  cancelPropertyReservationAction,
  rejectBookingRequestAction,
} from './actions'

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
}

type ReservationSummary = {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_whatsapp: string | null
  start_date: string | null
  end_date: string | null
  status: 'pending' | 'reserved' | 'checked_in' | 'completed' | 'cancelled' | string
  reservation_scope: 'entire_property' | 'entire_room' | 'beds' | string
  total_price_egp: number | null
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded' | string | null
  wallet_amount_used: number | null
  notes: string | null
  created_at: string
}

type Props = {
  requestId: string
  propertyId: string
  propertySellableOptions: PropertySellableOption[]
  rooms: RoomSummary[]
  requestedOptionCode?: RequestedOptionCode
  userId?: string | null
  currentWalletBalance?: number
  activeReservations?: ReservationSummary[]
}

function formatPrice(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `EGP ${Number(value).toLocaleString()}`
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return '—'
  }
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

function getRequestedOccupancySize(requestedOptionCode?: RequestedOptionCode) {
  if (requestedOptionCode === 'single_room') return 1
  if (requestedOptionCode === 'double_room') return 2
  if (requestedOptionCode === 'triple_room') return 3
  return null
}

function normalizeRoomOptionCode(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'single_room' || normalized === 'single') return 'single_room'
  if (normalized === 'double_room' || normalized === 'double') return 'double_room'
  if (normalized === 'triple_room' || normalized === 'triple') return 'triple_room'
  if (normalized === 'full_apartment') return 'full_apartment'

  return null
}

function normalizePositiveAmount(value: string) {
  const parsed = Number(String(value || '').trim())
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function getReservationStatusLabel(status: string) {
  if (status === 'checked_in') return 'Checked In'
  if (status === 'completed') return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'reserved') return 'Reserved'
  if (status === 'pending') return 'Pending'
  return status || 'Unknown'
}

function getReservationStatusClass(status: string) {
  if (status === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'reserved') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (status === 'checked_in') {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'cancelled') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-700'
}

function getReservationScopeLabel(scope: string) {
  if (scope === 'entire_property') return 'Entire Property'
  if (scope === 'entire_room') return 'Entire Room'
  if (scope === 'beds') return 'Beds'
  return scope || '—'
}

export default function BookingRequestActionsPanel({
  requestId,
  propertyId,
  propertySellableOptions,
  rooms,
  requestedOptionCode = null,
  userId = null,
  currentWalletBalance = 0,
  activeReservations = [],
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState('')

  const [useWalletBalance, setUseWalletBalance] = useState(false)
  const [walletAmountToUse, setWalletAmountToUse] = useState('')
  const [cancellingReservationId, setCancellingReservationId] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')

  const isFullApartmentRequest = requestedOptionCode === 'full_apartment'
  const requestedOccupancySize = getRequestedOccupancySize(requestedOptionCode)

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

    const activeRooms = rooms.filter(
      (room) => room.status !== 'inactive' && room.status !== 'fully_reserved'
    )

    if (!requestedOptionCode) {
      return activeRooms
    }

    return activeRooms.filter((room) => {
      const activeOptions = (room.sellableOptions || []).filter(
        (option) => option.is_active !== false
      )

      return activeOptions.some((option) => {
        const normalizedCode = normalizeRoomOptionCode(option.code)

        if (normalizedCode === requestedOptionCode) {
          return true
        }

        const optionOccupancy =
          option.occupancy_size ?? option.consumes_beds_count ?? null

        return (
          requestedOccupancySize !== null &&
          optionOccupancy === requestedOccupancySize
        )
      })
    })
  }, [rooms, isFullApartmentRequest, requestedOptionCode, requestedOccupancySize])

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

        const normalizedCode = normalizeRoomOptionCode(option.code)
        if (normalizedCode === requestedOptionCode) return true

        const optionOccupancy =
          option.occupancy_size ?? option.consumes_beds_count ?? null

        return (
          requestedOccupancySize !== null &&
          optionOccupancy === requestedOccupancySize
        )
      })
      .sort((a, b) => {
        const orderA = a.sort_order ?? 0
        const orderB = b.sort_order ?? 0
        return orderA - orderB
      })
  }, [selectedRoom, requestedOptionCode, requestedOccupancySize, isFullApartmentRequest])

  const [selectedRoomSellableOptionId, setSelectedRoomSellableOptionId] = useState('')

  useEffect(() => {
    if (filteredRoomOptions.length === 1) {
      setSelectedRoomSellableOptionId(filteredRoomOptions[0].id)
      return
    }

    if (
      selectedRoomSellableOptionId &&
      !filteredRoomOptions.some((option) => option.id === selectedRoomSellableOptionId)
    ) {
      setSelectedRoomSellableOptionId('')
    }
  }, [filteredRoomOptions, selectedRoomSellableOptionId])

  const selectedRoomOption = useMemo(() => {
    return (
      filteredRoomOptions.find((option) => option.id === selectedRoomSellableOptionId) || null
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

  const maxWalletUsableAmount = useMemo(() => {
    if (!userId) return 0
    if (typeof calculatedTotalPrice !== 'number' || calculatedTotalPrice <= 0) return 0
    return Math.max(Math.min(currentWalletBalance, calculatedTotalPrice), 0)
  }, [userId, calculatedTotalPrice, currentWalletBalance])

  const parsedWalletAmount = normalizePositiveAmount(walletAmountToUse)
  const safeWalletAmount =
    useWalletBalance && parsedWalletAmount
      ? Math.min(parsedWalletAmount, maxWalletUsableAmount)
      : 0

  const remainingAfterWallet =
    typeof calculatedTotalPrice === 'number'
      ? Math.max(calculatedTotalPrice - safeWalletAmount, 0)
      : null

  useEffect(() => {
    if (!useWalletBalance) {
      setWalletAmountToUse('')
      return
    }

    if (!userId || maxWalletUsableAmount <= 0) {
      setWalletAmountToUse('')
      return
    }

    if (!walletAmountToUse) {
      setWalletAmountToUse(String(maxWalletUsableAmount))
      return
    }

    const parsed = Number(walletAmountToUse)
    if (!Number.isFinite(parsed) || parsed > maxWalletUsableAmount) {
      setWalletAmountToUse(String(maxWalletUsableAmount))
    }
  }, [useWalletBalance, walletAmountToUse, maxWalletUsableAmount, userId])

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
    formData.set('use_wallet_balance', useWalletBalance ? 'true' : 'false')

    if (useWalletBalance && safeWalletAmount > 0) {
      formData.set('wallet_amount_to_use', String(safeWalletAmount))
    } else {
      formData.set('wallet_amount_to_use', '0')
    }
  }

  const handleUseFullWallet = () => {
    if (maxWalletUsableAmount > 0) {
      setUseWalletBalance(true)
      setWalletAmountToUse(String(maxWalletUsableAmount))
    }
  }

  const handleUseTotalPrice = () => {
    if (
      typeof calculatedTotalPrice === 'number' &&
      calculatedTotalPrice > 0 &&
      maxWalletUsableAmount > 0
    ) {
      setUseWalletBalance(true)
      setWalletAmountToUse(String(Math.min(calculatedTotalPrice, maxWalletUsableAmount)))
    }
  }

  const handleAccept = () => {
    setErrorMessage('')

    if (useWalletBalance) {
      if (!userId) {
        setErrorMessage(
          'Wallet payment is not available because this request is not linked to a user account.'
        )
        return
      }

      if (typeof calculatedTotalPrice !== 'number' || calculatedTotalPrice <= 0) {
        setErrorMessage('Total price must be available before using wallet balance.')
        return
      }

      if (maxWalletUsableAmount <= 0) {
        setErrorMessage('This user does not have available wallet balance.')
        return
      }

      if (!parsedWalletAmount || parsedWalletAmount <= 0) {
        setErrorMessage('Please enter a valid wallet amount.')
        return
      }

      if (parsedWalletAmount > maxWalletUsableAmount) {
        setErrorMessage('Wallet amount exceeds the maximum usable balance.')
        return
      }
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

        if (
          normalizedCode === 'double_room' ||
          normalizedCode === 'triple_room'
        ) {
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

        formData.set('sellable_option_id', selectedRoomOption.id)

        appendWalletFields(formData)

        await acceptBookingRequestAction(formData)
        router.refresh()
      } catch (error: any) {
        setErrorMessage(error.message || 'Something went wrong')
      }
    })
  }

  const handleCancelReservation = (reservationId: string) => {
    setErrorMessage('')

    const confirmed = window.confirm(
      'Are you sure you want to cancel this reservation? The room and beds will be recalculated and released if no other active reservation exists.'
    )

    if (!confirmed) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('reservation_id', reservationId)

        if (cancellationReason.trim()) {
          formData.set('cancellation_reason', cancellationReason.trim())
        }

        setCancellingReservationId(reservationId)
        await cancelPropertyReservationAction(formData)
        setCancellationReason('')
        setCancellingReservationId('')
        router.refresh()
      } catch (error: any) {
        setCancellingReservationId('')
        setErrorMessage(error.message || 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-700">
            Requested Option
          </p>
          <p className="mt-1 text-sm font-semibold text-blue-900">
            {getRequestedOptionLabel(requestedOptionCode)}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {isFullApartmentRequest ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Full Apartment Option
                </label>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {fullApartmentOption
                    ? `${getOptionDisplayName(fullApartmentOption)} — ${formatPrice(
                        fullApartmentOption.price_egp
                      )}`
                    : 'Full apartment option not found'}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Total Price
                </label>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
                  {formatPrice(calculatedTotalPrice)}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value)
                    setSelectedRoomSellableOptionId('')
                  }}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                >
                  <option value="">Select room</option>
                  {eligibleRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {getRoomDisplayName(room)} — {room.availableBedsCount} available beds
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Room Option
                </label>
                <select
                  value={selectedRoomSellableOptionId}
                  onChange={(e) => setSelectedRoomSellableOptionId(e.target.value)}
                  disabled={!selectedRoom}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {selectedRoom ? 'Select room option' : 'Select room first'}
                  </option>

                  {filteredRoomOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {getOptionDisplayName(option)} — {formatPrice(option.price_egp)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Total Price
                </label>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
                  {formatPrice(calculatedTotalPrice)}
                </div>
              </div>
            </>
          )}

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Current wallet balance</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {userId ? formatPrice(currentWalletBalance) : 'No linked user'}
              </p>
            </div>

            {!userId ? (
              <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Wallet payment is unavailable because this request is not linked to a signed-in user account.
              </div>
            ) : null}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={useWalletBalance}
                onChange={(e) => setUseWalletBalance(e.target.checked)}
                disabled={!userId || maxWalletUsableAmount <= 0}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-900">
                Use wallet balance for this reservation
              </span>
            </label>

            {useWalletBalance ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUseFullWallet}
                    disabled={maxWalletUsableAmount <= 0}
                    className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Use max available
                  </button>

                  <button
                    type="button"
                    onClick={handleUseTotalPrice}
                    disabled={maxWalletUsableAmount <= 0}
                    className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cover as much as possible
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Wallet amount to use
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={maxWalletUsableAmount || undefined}
                    value={walletAmountToUse}
                    onChange={(e) => setWalletAmountToUse(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Max usable now: {formatPrice(maxWalletUsableAmount)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-xs text-gray-500">Wallet deduction</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatPrice(safeWalletAmount || 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-xs text-gray-500">Remaining amount</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatPrice(remainingAfterWallet)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Accept'}
            </button>
          </div>
        </div>
      </div>

      {activeReservations.length > 0 ? (
        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                Active Reservations
              </p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">
                Cancel reservation and release availability
              </h3>
            </div>

            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
              {activeReservations.length} active
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Cancellation note
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Optional note for cancellation"
              rows={3}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="mt-4 space-y-3">
            {activeReservations.map((reservation) => {
              const isReservationPending =
                isPending && cancellingReservationId === reservation.id
              const canCancel = !['cancelled', 'completed'].includes(reservation.status)

              return (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Reservation #{reservation.id}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getReservationStatusClass(
                            reservation.status
                          )}`}
                        >
                          {getReservationStatusLabel(reservation.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <p className="text-xs text-gray-500">Scope</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {getReservationScopeLabel(reservation.reservation_scope)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <p className="text-xs text-gray-500">Total Price</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatPrice(reservation.total_price_egp)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(reservation.start_date)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <p className="text-xs text-gray-500">End Date</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatDate(reservation.end_date)}
                          </p>
                        </div>
                      </div>

                      {reservation.notes ? (
                        <div className="mt-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                            {reservation.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="md:pl-4">
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={!canCancel || isPending}
                        className="inline-flex w-full items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                      >
                        {isReservationPending ? 'Cancelling...' : 'Cancel Reservation'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
    </div>
  )
}