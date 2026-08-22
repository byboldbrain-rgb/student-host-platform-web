export const SERVICE_BOOKING_STATUSES = [
  'awaiting-whatsapp-send',
  'waiting-confirmation',
  'confirmed',
  'picked-up',
  'processing',
  'ready-for-delivery',
  'out-for-delivery',
  'delivered',
  'cancelled',
] as const;

export type ServiceBookingStatus = (typeof SERVICE_BOOKING_STATUSES)[number];

const SERVICE_BOOKING_TRANSITIONS: Record<
  ServiceBookingStatus,
  ServiceBookingStatus[]
> = {
  'awaiting-whatsapp-send': ['waiting-confirmation', 'cancelled'],
  'waiting-confirmation': ['confirmed', 'cancelled'],
  confirmed: ['picked-up', 'cancelled'],
  'picked-up': ['processing', 'cancelled'],
  processing: ['ready-for-delivery', 'cancelled'],
  'ready-for-delivery': ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function isServiceBookingStatus(value: string): value is ServiceBookingStatus {
  return SERVICE_BOOKING_STATUSES.includes(value as ServiceBookingStatus);
}

export function getAllowedServiceBookingTransitions(status: string) {
  if (!isServiceBookingStatus(status)) {
    return [];
  }

  return SERVICE_BOOKING_TRANSITIONS[status];
}
