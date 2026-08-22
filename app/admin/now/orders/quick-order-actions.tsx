'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowLeft, Ban, X } from 'lucide-react';

import type { OrderStatus } from '../lib/types';
import { quickTransitionOrder } from './actions';

const nextActionByStatus: Partial<Record<OrderStatus, { label: string; pendingLabel: string }>> = {
  waiting_confirmation: { label: 'تأكيد الطلب', pendingLabel: 'جاري التأكيد...' },
  confirmed: { label: 'بدء التجهيز', pendingLabel: 'جاري التحديث...' },
  preparing: { label: 'خرج للتوصيل', pendingLabel: 'جاري التحديث...' },
  out_for_delivery: { label: 'تم التوصيل', pendingLabel: 'جاري الإنهاء...' },
};

function NextSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
      {!pending ? <ArrowLeft size={13} /> : null}
    </button>
  );
}

function CancelSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'جاري الإلغاء...' : 'تأكيد إلغاء الطلب'}
    </button>
  );
}

export default function QuickOrderActions({
  orderId,
  orderCode,
  status,
  returnTo,
}: {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  returnTo: string;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const nextAction = nextActionByStatus[status];
  const canCancel = !['delivered', 'cancelled'].includes(status);

  if (!nextAction && !canCancel) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {nextAction ? (
          <form action={quickTransitionOrder}>
            <input type="hidden" name="order_id" value={orderId} />
            <input type="hidden" name="mode" value="next" />
            <input type="hidden" name="current_status" value={status} />
            <input type="hidden" name="return_to" value={returnTo} />
            <NextSubmitButton label={nextAction.label} pendingLabel={nextAction.pendingLabel} />
          </form>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Ban size={13} />
            إلغاء
          </button>
        ) : null}
      </div>

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCancelOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-order-${orderId}`}
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
              <div>
                <p className="text-xs font-semibold text-rose-600">إلغاء الطلب</p>
                <h2 id={`cancel-order-${orderId}`} dir="ltr" className="mt-1 text-right text-lg font-semibold text-slate-950">
                  {orderCode}
                </h2>
                <p className="mt-2 text-xs font-medium leading-6 text-slate-500">
                  الإلغاء هيتسجل في سجل الطلب. اكتب السبب قبل التأكيد.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>

            <form action={quickTransitionOrder} className="p-5">
              <input type="hidden" name="order_id" value={orderId} />
              <input type="hidden" name="mode" value="cancel" />
              <input type="hidden" name="current_status" value={status} />
              <input type="hidden" name="return_to" value={returnTo} />

              <label className="block text-xs font-semibold text-slate-700">
                سبب الإلغاء *
                <textarea
                  name="cancellation_reason"
                  required
                  minLength={3}
                  autoFocus
                  placeholder="مثال: المنتج غير متوفر / العميل طلب الإلغاء"
                  className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <div className="mt-5 flex gap-2">
                <CancelSubmitButton />
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  className="min-h-10 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  رجوع
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
