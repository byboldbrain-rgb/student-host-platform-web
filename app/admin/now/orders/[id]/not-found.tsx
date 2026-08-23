import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function OrderNotFound() {
  return (
    <div className="orders-operations">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><FileQuestion aria-hidden="true" size={22} /></span>
        <h1 className="mt-3 text-lg font-semibold text-slate-950">الطلب غير موجود</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">قد يكون الرابط غير صحيح أو لم يعد الطلب متاحًا لحسابك.</p>
        <Link href="/admin/now/orders" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">العودة إلى الطلبات</Link>
      </section>
    </div>
  );
}
