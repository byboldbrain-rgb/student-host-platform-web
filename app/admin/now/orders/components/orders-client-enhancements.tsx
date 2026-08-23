'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, RefreshCw } from 'lucide-react';

import { formatOrderAge } from '../order-helpers';

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    && (target.isContentEditable
      || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export function RefreshOrdersButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      data-orders-refresh
      aria-keyshortcuts="R"
      aria-busy={isPending}
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-wait disabled:opacity-65"
    >
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
      ) : (
        <RefreshCw aria-hidden="true" size={15} />
      )}
      {isPending ? 'جاري التحديث…' : 'تحديث يدوي'}
      <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline">R</kbd>
    </button>
  );
}

export default function OrdersClientEnhancements() {
  useEffect(() => {
    const liveRegion = document.querySelector<HTMLElement>('[data-orders-live-region]');

    function updateOrderAges() {
      const now = Date.now();
      document.querySelectorAll<HTMLElement>('[data-order-created-at]').forEach((element) => {
        const createdAt = element.dataset.orderCreatedAt;
        if (createdAt) element.textContent = formatOrderAge(createdAt, now);
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (document.querySelector('dialog[open]')) return;

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[data-orders-search]')?.focus();
      }

      if (event.key.toLowerCase() === 'r' && !isTypingTarget(event.target)) {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>('[data-orders-refresh]')?.click();
      }
    }

    async function onClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-copy-value]')
        : null;
      if (!target) return;

      const value = target.dataset.copyValue;
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        if (liveRegion) liveRegion.textContent = `تم نسخ ${value}`;
      } catch {
        if (liveRegion) liveRegion.textContent = 'تعذر النسخ. حدّد النص وانسخه يدويًا.';
      }
    }

    updateOrderAges();
    const intervalId = window.setInterval(updateOrderAges, 60_000);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return <span data-orders-live-region className="sr-only" aria-live="polite" />;
}
