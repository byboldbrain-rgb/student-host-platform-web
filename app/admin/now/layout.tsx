import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  ClipboardList,
  House,
} from 'lucide-react';

import { requireNowAdmin } from './lib/admin-data';

export default async function NavientyNowAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { access } = await requireNowAdmin();

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-950"
    >
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold text-violet-600">
              Navienty Now
            </p>

            <h1 className="text-lg font-black">
              لوحة تشغيل الطلبات
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/now/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white hover:bg-violet-700"
            >
              <ClipboardList size={17} />
              الطلبات
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              <House size={17} />
              لوحة Navienty
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-slate-500 sm:px-6 lg:px-8">
            <span>
              صلاحية Navienty Now: {access.now_role}
            </span>

            <span>
              {access.permissions.manage_orders
                ? 'يمكنك تغيير حالات الطلبات'
                : 'عرض الطلبات فقط'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
