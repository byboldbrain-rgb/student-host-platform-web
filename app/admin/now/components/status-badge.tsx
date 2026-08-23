import {
  BadgeCheck,
  Ban,
  Check,
  Clock3,
  CircleAlert,
  MessageCircle,
  Package,
  RotateCcw,
  Truck,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

import type { OrderStatus, PaymentStatus } from '../lib/types';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  type PaymentIconName,
  type StatusIconName,
} from '../orders/order-domain';

const orderIcons: Record<StatusIconName, LucideIcon> = {
  message: MessageCircle,
  clock: Clock3,
  check: Check,
  package: Package,
  truck: Truck,
  complete: BadgeCheck,
  cancel: Ban,
};

const paymentIcons: Record<PaymentIconName, LucideIcon> = {
  clock: Clock3,
  wallet: WalletCards,
  check: BadgeCheck,
  warning: CircleAlert,
  refund: RotateCcw,
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  const Icon = orderIcons[meta.icon];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  const Icon = paymentIcons[meta.icon];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
      <span className="opacity-70">الدفع:</span>
      {meta.label}
    </span>
  );
}

export { getOrderStatusLabel, getPaymentStatusLabel };
