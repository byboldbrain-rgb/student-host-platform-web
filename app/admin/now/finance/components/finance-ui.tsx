import type { ReactNode } from 'react';

export function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function number(value: number | string | null | undefined, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-EG', { maximumFractionDigits }).format(Number(value ?? 0));
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function dateTimeLabel(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function Kpi({
  label,
  value,
  note,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'blue';
}) {
  const tones = {
    neutral: 'border-black/[0.06] bg-white text-[#111827]',
    positive: 'border-emerald-100 bg-emerald-50/70 text-emerald-950',
    negative: 'border-rose-100 bg-rose-50/70 text-rose-950',
    warning: 'border-amber-100 bg-amber-50/70 text-amber-950',
    blue: 'border-blue-100 bg-blue-50/70 text-blue-950',
  } as const;

  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_6px_24px_rgba(15,23,42,0.045)] ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-55">{label}</p>
          <div className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">{value}</div>
        </div>
        {icon ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/80 shadow-sm">{icon}</span> : null}
      </div>
      {note ? <div className="mt-2 text-[11px] font-medium leading-5 opacity-60">{note}</div> : null}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-black/[0.055] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] md:p-6 ${className}`}>
      {title || description || action ? (
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-tight text-[#111827]">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs font-medium leading-6 text-gray-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'blue';
}) {
  const tones = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-600',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  } as const;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export const financeInput = 'mt-1.5 h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm font-semibold text-[#111827] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70';
export const financeTextarea = 'mt-1.5 min-h-24 w-full rounded-[14px] border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#111827] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70';
export const financeLabel = 'block text-[11px] font-semibold text-gray-600';
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_7px_18px_rgba(37,99,235,0.18)] transition hover:bg-blue-700';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50';
