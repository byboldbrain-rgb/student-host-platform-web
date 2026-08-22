import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, CircleCheck, Info, TriangleAlert } from 'lucide-react';

export const inputClass =
  'mt-2 h-12 w-full rounded-[16px] border border-gray-200 bg-white px-3.5 text-sm font-semibold text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

export const textareaClass =
  'mt-2 min-h-32 w-full resize-y rounded-[16px] border border-gray-200 bg-white px-3.5 py-3 text-sm font-semibold leading-6 text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

export const labelClass = 'block text-xs font-semibold text-gray-700';

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-black/[0.05] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#f7f8fa] to-white" />
      <div className="absolute left-[-80px] top-[-90px] h-56 w-56 rounded-full bg-blue-50/70 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:px-8 lg:py-8">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
              {icon ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-blue-100 bg-blue-50 text-blue-700">
                  {icon}
                </span>
              ) : null}
              <span>{eyebrow}</span>
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2.5 max-w-3xl text-sm font-medium leading-7 text-gray-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </section>
  );
}

const metricTones = {
  violet: 'border-blue-100 bg-blue-50 text-blue-800',
  amber: 'border-amber-100 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  sky: 'border-sky-100 bg-sky-50 text-sky-800',
  slate: 'border-black/[0.06] bg-white text-[#111827]',
} as const;

export function MetricCard({
  label,
  value,
  note,
  href,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string | number;
  note?: string;
  href?: string;
  icon?: ReactNode;
  tone?: keyof typeof metricTones;
}) {
  const content = (
    <div
      className={`h-full rounded-[24px] border p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ${metricTones[tone]} ${href ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-65">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-black/[0.04] bg-white/80 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
            {icon}
          </span>
        ) : null}
      </div>
      {note ? <p className="mt-2.5 text-[11px] font-medium leading-5 opacity-65">{note}</p> : null}
      {href ? (
        <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold opacity-80">
          فتح
          <ArrowLeft size={13} />
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning';
  title: string;
  children?: ReactNode;
}) {
  const tones = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
  } as const;
  const Icon = tone === 'warning' ? TriangleAlert : tone === 'success' ? CircleCheck : Info;

  return (
    <div className={`flex items-start gap-3 rounded-[22px] border p-4.5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] ${tones[tone]}`}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-white/70">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {children ? <div className="mt-1 text-xs font-medium leading-6 opacity-80">{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-[28px] border border-dashed border-gray-300 bg-white p-8 text-center shadow-[0_6px_24px_rgba(15,23,42,0.03)]">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f5f7f9] text-gray-500">{icon}</div>
      ) : null}
      <p className="mt-3 text-base font-semibold text-[#111827]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs font-medium leading-6 text-gray-500">{description}</p> : null}
    </div>
  );
}
