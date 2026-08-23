'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  ArrowLeft,
  Ban,
  LoaderCircle,
  MessageCircle,
  X,
} from 'lucide-react';

import type { OrderStatus } from '../lib/types';
import { transitionOrderAction } from './actions';
import {
  canCancelOrder,
  getNextOrderAction,
  type OrderActionState,
} from './order-domain';
import { phoneDigits } from './order-helpers';

const initialActionState: OrderActionState = {
  outcome: 'idle',
  message: '',
};

function NextSubmitButton({
  label,
  pendingLabel,
  variant,
}: {
  label: string;
  pendingLabel: string;
  variant: 'compact' | 'detail';
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-busy={pending}
      disabled={pending}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-65',
        variant === 'detail' ? 'w-full text-sm' : 'min-w-[8.25rem]',
      ].join(' ')}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
      ) : (
        <ArrowLeft aria-hidden="true" size={14} />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

function CancelSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-busy={pending}
      disabled={pending}
      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-wait disabled:opacity-65"
    >
      {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
      {pending ? 'جاري الإلغاء…' : 'تأكيد الإلغاء'}
    </button>
  );
}

function HiddenOrderFields({
  orderId,
  status,
  mode,
}: {
  orderId: string;
  status: OrderStatus;
  mode: 'next' | 'cancel';
}) {
  return (
    <>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="current_status" value={status} />
    </>
  );
}

export default function QuickOrderActions({
  orderId,
  orderCode,
  status,
  customerPhone,
  variant = 'compact',
}: {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  customerPhone?: string;
  variant?: 'compact' | 'detail';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancellationReasonRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const instanceId = useId();
  const [nextState, nextAction] = useActionState(
    transitionOrderAction,
    initialActionState,
  );
  const [cancelState, cancelAction] = useActionState(
    transitionOrderAction,
    initialActionState,
  );
  const operation = getNextOrderAction(status);
  const canCancel = canCancelOrder(status);
  const contactNumber = customerPhone ? phoneDigits(customerPhone) : '';
  const feedback = cancelState.outcome === 'success' ? cancelState : nextState;
  const titleId = `${instanceId}-cancel-title`;
  const helpId = `${instanceId}-cancel-help`;
  const reasonId = `${instanceId}-cancel-reason`;

  useEffect(() => {
    if (cancelState.outcome === 'success' && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [cancelState.outcome]);

  useEffect(() => {
    if (nextState.outcome === 'success' || cancelState.outcome === 'success') {
      window.requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }, [nextState, cancelState]);

  function openCancellationDialog() {
    dialogRef.current?.showModal();

    if (window.matchMedia('(min-width: 768px)').matches) {
      window.requestAnimationFrame(() => cancellationReasonRef.current?.focus());
    }
  }

  if (!operation && !canCancel && feedback.outcome === 'idle') {
    return null;
  }

  return (
    <div className={variant === 'detail' ? 'space-y-3' : 'min-w-0'}>
      <div className={variant === 'detail' ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
        {operation ? (
          <form action={nextAction}>
            <HiddenOrderFields orderId={orderId} status={status} mode="next" />
            <NextSubmitButton
              label={operation.label}
              pendingLabel={operation.pendingLabel}
              variant={variant}
            />
          </form>
        ) : status === 'awaiting_whatsapp_send' && contactNumber ? (
          <a
            href={`https://wa.me/${contactNumber}`}
            target="_blank"
            rel="noreferrer"
            className={[
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200',
              variant === 'detail' ? 'w-full text-sm' : '',
            ].join(' ')}
          >
            <MessageCircle aria-hidden="true" size={15} />
            فتح واتساب
          </a>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={openCancellationDialog}
            className={[
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100',
              variant === 'detail' ? 'w-full' : '',
            ].join(' ')}
          >
            <Ban aria-hidden="true" size={14} />
            إلغاء الطلب
          </button>
        ) : null}
      </div>

      {feedback.outcome !== 'idle' ? (
        <p
          ref={feedbackRef}
          tabIndex={-1}
          role={feedback.outcome === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={[
            'mt-2 max-w-[34rem] rounded-xl border px-3 py-2 text-xs font-semibold leading-5 outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
            feedback.outcome === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          ].join(' ')}
        >
          {feedback.message}
        </p>
      ) : null}

      {canCancel ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={helpId}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-right text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop:bg-slate-950/50 backdrop:backdrop-blur-[2px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-rose-700">إجراء لا يمكن التراجع عنه من هذه الشاشة</p>
              <h2 id={titleId} className="mt-1 text-lg font-semibold">
                إلغاء الطلب <bdi dir="ltr">{orderCode}</bdi>
              </h2>
              <p id={helpId} className="mt-2 text-xs font-medium leading-5 text-slate-600">
                سيُسجل السبب في الطلب. راجع الرقم والسبب قبل التأكيد.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              aria-label="إغلاق نافذة إلغاء الطلب"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <form action={cancelAction} className="p-5">
            <HiddenOrderFields orderId={orderId} status={status} mode="cancel" />

            <label htmlFor={reasonId} className="block text-xs font-semibold text-slate-800">
              سبب الإلغاء <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <textarea
              ref={cancellationReasonRef}
              id={reasonId}
              name="cancellation_reason"
              required
              minLength={3}
              aria-required="true"
              placeholder="مثال: المنتج غير متوفر أو العميل طلب الإلغاء"
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            />

            {cancelState.outcome === 'error' ? (
              <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-900">
                {cancelState.message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                رجوع بدون إلغاء
              </button>
              <CancelSubmitButton />
            </div>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
