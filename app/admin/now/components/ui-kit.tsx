import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, CircleCheck, Info, TriangleAlert } from 'lucide-react';

export const inputClass =
  'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100/70 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export const textareaClass =
  'mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100/70 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export const labelClass = 'block text-xs font-black text-slate-700';

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
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-violet-700">
              {icon ? <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">{icon}</span> : null}
              <span>{eyebrow}</span>
            </div>
          ) : null}
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

const metricTones = {
  violet: 'border-violet-100 bg-violet-50 text-violet-800',
  amber: 'border-amber-100 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  sky: 'border-sky-100 bg-sky-50 text-sky-800',
  slate: 'border-slate-200 bg-white text-slate-900',
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
    <div className={`h-full rounded-2xl border p-4 shadow-sm transition ${metricTones[tone]} ${href ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        {icon ? <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70">{icon}</span> : null}
      </div>
      {note ? <p className="mt-2 text-[11px] font-bold opacity-65">{note}</p> : null}
      {href ? (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-black opacity-80">
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
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon className="mt-0.5 shrink-0" size={19} />
      <div>
        <p className="text-sm font-black">{title}</p>
        {children ? <div className="mt-1 text-xs font-semibold leading-6 opacity-80">{children}</div> : null}
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
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">{icon}</div> : null}
      <p className="mt-3 text-base font-black text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs font-semibold leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
