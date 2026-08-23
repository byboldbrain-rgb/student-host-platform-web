import type { AdminOrdersResponse, OrderStatus, PaymentStatus } from '../lib/types';
import { ORDER_STATUS_META, ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from './order-domain';

export type OrdersSearchParams = Record<string, string | string[] | undefined>;

export type OrdersQuery = {
  search: string;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  page: number;
};

const exactDateTimeFormatter = new Intl.DateTimeFormat('ar-EG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Cairo',
});

const numberFormatter = new Intl.NumberFormat('ar-EG', {
  maximumFractionDigits: 2,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat('ar-EG', {
  numeric: 'auto',
});

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function parseOrderStatus(value: string): OrderStatus | null {
  return ORDER_STATUS_VALUES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : null;
}

export function parsePaymentStatus(value: string): PaymentStatus | null {
  return PAYMENT_STATUS_VALUES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : null;
}

export function parseOrdersQuery(params: OrdersSearchParams): OrdersQuery {
  const rawPage = Number(first(params.page));

  return {
    search: first(params.search).trim(),
    status: parseOrderStatus(first(params.status)),
    paymentStatus: parsePaymentStatus(first(params.payment_status)),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function buildOrdersUrl(input: OrdersQuery) {
  const params = new URLSearchParams();

  if (input.search) params.set('search', input.search);
  if (input.status) params.set('status', input.status);
  if (input.paymentStatus) params.set('payment_status', input.paymentStatus);
  if (input.page > 1) params.set('page', String(input.page));

  const query = params.toString();
  return query ? `/admin/now/orders?${query}` : '/admin/now/orders';
}

export function updateOrdersQuery(
  current: OrdersQuery,
  updates: Partial<OrdersQuery>,
) {
  return buildOrdersUrl({ ...current, ...updates });
}

export function safeOrdersReturnPath(raw: string | undefined) {
  if (!raw || !raw.startsWith('/admin/now/orders') || raw.startsWith('//')) {
    return '/admin/now/orders';
  }

  try {
    const url = new URL(raw, 'https://navienty.local');
    if (url.pathname !== '/admin/now/orders') return '/admin/now/orders';
    url.searchParams.delete('quick_success');
    url.searchParams.delete('quick_error');
    return `${url.pathname}${url.search}`;
  } catch {
    return '/admin/now/orders';
  }
}

export function buildOrderDetailUrl(orderId: string, returnTo: string) {
  const params = new URLSearchParams({ return_to: safeOrdersReturnPath(returnTo) });
  return `/admin/now/orders/${encodeURIComponent(orderId)}?${params.toString()}`;
}

export function formatOrderDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : exactDateTimeFormatter.format(date);
}

export function formatOrderAge(value: string, now = Date.now()) {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return 'وقت غير معروف';

  const elapsedSeconds = Math.max(0, Math.round((now - createdAt) / 1000));
  if (elapsedSeconds < 60) return 'الآن';

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return relativeTimeFormatter.format(-elapsedMinutes, 'minute');

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return relativeTimeFormatter.format(-elapsedHours, 'hour');

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return relativeTimeFormatter.format(-elapsedDays, 'day');

  return formatOrderDateTime(value);
}

export function formatMoney(
  value: number | string,
  symbol: string,
  currencyCode?: string,
) {
  const parsed = Number(value);
  const amount = numberFormatter.format(Number.isFinite(parsed) ? parsed : 0);
  return `${amount} ${symbol || currencyCode || ''}`.trim();
}

export function formatCount(value: number) {
  return value.toLocaleString('ar-EG');
}

export function getActiveOrdersCount(summary: AdminOrdersResponse['summary']) {
  return (Object.keys(ORDER_STATUS_META) as OrderStatus[]).reduce((total, status) => {
    return ORDER_STATUS_META[status].isActive ? total + summary[status] : total;
  }, 0);
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}
