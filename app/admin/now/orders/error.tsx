'use client';

import Link from 'next/link';
import { RotateCcw, TriangleAlert } from 'lucide-react';

export default function OrdersError({ reset }: { reset: () => void }) {
  return (
    <div className="orders-operations">
      <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><TriangleAlert aria-hidden="true" size={22} /></span>
        <h1 className="mt-3 text-lg font-semibold text-slate-950">تعذر تحميل بيانات الطلبات</h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">لم نغيّر أي بيانات. حاول التحميل مرة أخرى، أو ارجع إلى قائمة الطلبات.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><RotateCcw aria-hidden="true" size={15} /> إعادة المحاولة</button>
          <Link href="/admin/now/orders" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">قائمة الطلبات</Link>
        </div>
      </section>
    </div>
  );
}
