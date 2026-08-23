'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Banknote,
  Bell,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Database,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Settings,
  ShieldCheck,
  Store,
  UsersRound,
  Wrench,
} from 'lucide-react';

import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton';
import type { AdminAccessContext } from '../lib/types';

type NavItem = { label: string; href: string; icon: LucideIcon; show: boolean };
type NavGroup = { label: string; items: NavItem[] };

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: 'مالك النظام',
    super_admin: 'مدير النظام',
    admin: 'مدير',
    operations: 'موظف تشغيل',
    customer_support: 'خدمة العملاء',
    catalog_manager: 'مسؤول كتالوج',
    finance: 'مالية',
    viewer: 'مشاهدة فقط',
  };
  return labels[role] ?? role.replaceAll('_', ' ');
}

function isActive(pathname: string, href: string) {
  if (href === '/admin/now') return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandLogo() {
  return (
    <Link href="/admin/now" aria-label="Navienty Now home" className="group flex items-center gap-2">
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
      />
      <span className="hidden items-center overflow-hidden lg:flex">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="h-auto w-[104px] object-contain"
        />
      </span>
    </Link>
  );
}

export default function NowAdminShell({ access, children }: { access: AdminAccessContext; children: ReactNode }) {
  const pathname = usePathname();
  const permissions = access.permissions;
  const reviewVisible = permissions.manage_orders || permissions.manage_settings;

  const groups: NavGroup[] = [
    {
      label: 'مساحة العمل',
      items: [
        { label: 'الرئيسية', href: '/admin/now', icon: LayoutDashboard, show: true },
        { label: 'الطلبات', href: '/admin/now/orders', icon: ClipboardList, show: permissions.view_orders },
        { label: 'المراجعات المعلقة', href: '/admin/now/review', icon: ClipboardCheck, show: reviewVisible },
      ],
    },
    {
      label: 'التجارة والتشغيل',
      items: [
        { label: 'المتاجر والمنتجات', href: '/admin/now/sections/catalog', icon: Store, show: permissions.manage_catalog },
        { label: 'العروض والكوبونات', href: '/admin/now/sections/marketing', icon: Megaphone, show: permissions.manage_catalog },
        { label: 'مناطق التغطية', href: '/admin/now/sections/geography', icon: MapPinned, show: permissions.manage_settings },
        { label: 'الدفع والتحصيل', href: '/admin/now/sections/payments', icon: Banknote, show: permissions.manage_finance },
        { label: 'الخدمات والحجوزات', href: '/admin/now/sections/services', icon: Wrench, show: permissions.manage_catalog || permissions.manage_orders },
      ],
    },
    {
      label: 'الثقة والنظام',
      items: [
        { label: 'التحقق والامتثال', href: '/admin/now/sections/compliance', icon: ShieldCheck, show: reviewVisible },
        { label: 'الإشعارات', href: '/admin/now/sections/notifications', icon: Bell, show: permissions.manage_settings },
        { label: 'إعدادات التطبيق', href: '/admin/now/settings', icon: Settings, show: permissions.manage_settings },
        { label: 'فريق الإدارة', href: '/admin/now/team', icon: UsersRound, show: permissions.manage_settings },
        { label: 'إدارة النظام', href: '/admin/now/sections/system', icon: Boxes, show: permissions.manage_settings },
      ],
    },
  ];

  const visibleItems = groups.flatMap((group) => group.items).filter((item) => item.show);

  return (
    <div dir="rtl" className="now-admin-shell min-h-screen bg-[#fbfbfb] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-[#f5f7f9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1800px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo />
            <div className="hidden h-8 w-px bg-gray-200 md:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#111827] md:text-base">Navienty Now</span>
                <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 sm:inline-flex">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 hidden text-[11px] font-medium text-gray-500 sm:block">مركز التشغيل والإدارة</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-black/[0.05] bg-white px-3 py-2 text-[11px] font-semibold text-gray-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              متصل
            </div>
            <div className="hidden rounded-full border border-black/[0.05] bg-white px-3 py-2 text-[11px] font-semibold text-gray-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] sm:block">
              {roleLabel(access.now_role)}
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1800px] items-start">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[286px] shrink-0 border-l border-black/[0.05] bg-white lg:flex lg:flex-col">
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-6">
              {groups.map((group) => {
                const items = group.items.filter((item) => item.show);
                if (!items.length) return null;

                return (
                  <section key={group.label}>
                    <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={[
                              'group flex min-h-[48px] items-center gap-3 rounded-[16px] border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                              active
                                ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-[0_6px_18px_rgba(37,99,235,0.08)]'
                                : 'border-transparent text-gray-600 hover:border-black/[0.05] hover:bg-[#f8f9fb] hover:text-[#111827]',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] transition-all duration-200',
                                active
                                  ? 'bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.22)]'
                                  : 'bg-[#f3f5f8] text-gray-500 group-hover:bg-white',
                              ].join(' ')}
                            >
                              <Icon size={17} strokeWidth={2.1} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <Link
                href="/admin/now/data"
                className={[
                  'flex min-h-[46px] items-center gap-3 rounded-[16px] border px-3.5 py-2.5 text-xs font-semibold transition-all',
                  pathname.startsWith('/admin/now/data')
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-transparent text-gray-500 hover:border-black/[0.05] hover:bg-[#f8f9fb] hover:text-[#111827]',
                ].join(' ')}
              >
                <Database size={16} />
                أدوات البيانات المتقدمة
              </Link>
            </div>
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-[20px] border border-black/[0.05] bg-[#fafbfc] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">الحساب الحالي</p>
              <p className="mt-1.5 text-sm font-semibold text-[#111827]">{roleLabel(access.now_role)}</p>
              <Link
                href="/admin"
                className="mt-3 flex items-center justify-between rounded-[14px] bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:text-blue-700"
              >
                <span>العودة للوحة Navienty</span>
                <ArrowLeft size={15} />
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="overflow-x-auto border-b border-black/[0.05] bg-white px-3 py-2 lg:hidden">
            <div className="flex min-w-max gap-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'inline-flex min-h-[42px] items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)]'
                        : 'border-gray-200 bg-white text-gray-600',
                    ].join(' ')}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="mx-auto w-full max-w-[1510px] px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
