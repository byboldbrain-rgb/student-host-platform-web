import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Banknote,
  Bell,
  ClipboardList,
  Database,
  House,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Settings,
  ShieldCheck,
  Store,
  Wrench,
} from 'lucide-react';

import { requireNowAdmin } from './lib/admin-data';

export default async function NavientyNowAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { access } = await requireNowAdmin();

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">Navienty Now</p>
              <h1 className="text-lg font-black">Admin Control Center</h1>
              <p className="mt-1 text-xs text-slate-500">
                التطبيق · المتاجر · الكتالوج · التسويق · التغطية · الدفع · الخدمات · الإشعارات · النظام
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              <House size={17} />
              لوحة Navienty
              <ArrowRight size={16} />
            </Link>
          </div>

          <nav className="mt-4 flex flex-wrap items-center gap-2">
            <Link href="/admin/now" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
              <LayoutDashboard size={15} /> الرئيسية
            </Link>

            {access.permissions.view_orders ? (
              <Link href="/admin/now/sections/orders" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                <ClipboardList size={15} /> الطلبات
              </Link>
            ) : null}

            {access.permissions.manage_catalog ? (
              <>
                <Link href="/admin/now/sections/catalog" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                  <Store size={15} /> المتاجر والكتالوج
                </Link>
                <Link href="/admin/now/sections/marketing" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                  <Megaphone size={15} /> التسويق
                </Link>
              </>
            ) : null}

            {access.permissions.manage_settings ? (
              <Link href="/admin/now/sections/geography" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                <MapPinned size={15} /> التغطية
              </Link>
            ) : null}

            {access.permissions.manage_finance ? (
              <Link href="/admin/now/sections/payments" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                <Banknote size={15} /> الدفع
              </Link>
            ) : null}

            {access.permissions.manage_catalog || access.permissions.manage_orders ? (
              <Link href="/admin/now/sections/services" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                <Wrench size={15} /> الخدمات
              </Link>
            ) : null}

            {access.permissions.manage_orders || access.permissions.manage_settings ? (
              <>
                <Link href="/admin/now/sections/compliance" className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">
                  <ShieldCheck size={15} /> الامتثال
                </Link>
                <Link href="/admin/now/review" className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">
                  <ShieldCheck size={15} /> المراجعات المعلقة
                </Link>
              </>
            ) : null}

            {access.permissions.manage_settings ? (
              <>
                <Link href="/admin/now/sections/notifications" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                  <Bell size={15} /> الإشعارات
                </Link>
                <Link href="/admin/now/settings" className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-800 hover:bg-violet-100">
                  <Settings size={15} /> إعدادات التطبيق
                </Link>
                <Link href="/admin/now/sections/system" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-violet-300 hover:text-violet-700">
                  <Settings size={15} /> النظام
                </Link>
              </>
            ) : null}

            <Link href="/admin/now/data" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700">
              <Database size={15} /> كل بيانات Now
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-bold text-slate-500 sm:px-6 lg:px-8">
            <span>الصلاحية: <strong className="text-slate-800">{access.now_role}</strong></span>
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span>Orders: {access.permissions.manage_orders ? 'Manage' : access.permissions.view_orders ? 'View' : 'No'}</span>
              <span>Catalog: {access.permissions.manage_catalog ? 'Manage' : 'No'}</span>
              <span>Finance: {access.permissions.manage_finance ? 'Manage' : 'No'}</span>
              <span>Settings: {access.permissions.manage_settings ? 'Manage' : 'No'}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
