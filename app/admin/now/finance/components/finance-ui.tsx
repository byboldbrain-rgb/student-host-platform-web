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
  const accent = {
    neutral: 'bg-slate-900 text-white',
    positive: 'bg-emerald-500 text-white',
    negative: 'bg-rose-500 text-white',
    warning: 'bg-amber-400 text-amber-950',
    blue: 'bg-blue-600 text-white',
  } as const;
  const valueTone = {
    neutral: 'text-slate-950',
    positive: 'text-emerald-700',
    negative: 'text-rose-700',
    warning: 'text-amber-800',
    blue: 'text-blue-700',
  } as const;

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_14px_36px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.07)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <div className={`mt-3 text-[27px] font-bold leading-none tracking-[-0.035em] sm:text-[30px] ${valueTone[tone]}`}>{value}</div>
        </div>
        {icon ? <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] shadow-sm ${accent[tone]}`}>{icon}</span> : null}
      </div>
      {note ? <div className="mt-3 min-h-5 text-[11px] font-medium leading-5 text-slate-500">{note}</div> : null}
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
    <section className={`overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_16px_44px_rgba(15,23,42,0.045)] ${className}`}>
      {title || description || action ? (
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start md:px-6">
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] font-bold tracking-[-0.015em] text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-1 max-w-3xl text-[11px] font-medium leading-5 text-slate-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="p-5 md:p-6">{children}</div>
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
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    success: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200/80 bg-amber-50 text-amber-800',
    danger: 'border-rose-200/80 bg-rose-50 text-rose-700',
    blue: 'border-blue-200/80 bg-blue-50 text-blue-700',
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

export const financeInput = 'mt-1.5 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70';
export const financeTextarea = 'mt-1.5 min-h-24 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70';
export const financeLabel = 'block text-[11px] font-bold text-slate-600';
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(15,23,42,0.15)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50';
