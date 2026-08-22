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
  Wrench,
} from 'lucide-react';

import type { AdminAccessContext } from '../lib/types';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  show: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: 'مالك النظام',
    super_admin: 'مدير النظام',
    admin: 'مدير',
    operator: 'موظف تشغيل',
    viewer: 'مشاهدة فقط',
  };

  return labels[role] ?? role.replaceAll('_', ' ');
}

function isActive(pathname: string, href: string) {
  if (href === '/admin/now') {
    return pathname === href || pathname === `${href}/`;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NowAdminShell({
  access,
  children,
}: {
  access: AdminAccessContext;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const permissions = access.permissions;
  const reviewVisible = permissions.manage_orders || permissions.manage_settings;

  const groups: NavGroup[] = [
    {
      label: 'مساحة العمل',
      items: [
        {
          label: 'الرئيسية',
          href: '/admin/now',
          icon: LayoutDashboard,
          show: true,
        },
        {
          label: 'الطلبات',
          href: '/admin/now/orders',
          icon: ClipboardList,
          show: permissions.view_orders,
        },
        {
          label: 'المراجعات المعلقة',
          href: '/admin/now/review',
          icon: ClipboardCheck,
          show: reviewVisible,
        },
      ],
    },
    {
      label: 'التجارة والتشغيل',
      items: [
        {
          label: 'المتاجر والمنتجات',
          href: '/admin/now/sections/catalog',
          icon: Store,
          show: permissions.manage_catalog,
        },
        {
          label: 'العروض والكوبونات',
          href: '/admin/now/sections/marketing',
          icon: Megaphone,
          show: permissions.manage_catalog,
        },
        {
          label: 'مناطق التغطية',
          href: '/admin/now/sections/geography',
          icon: MapPinned,
          show: permissions.manage_settings,
        },
        {
          label: 'الدفع والتحصيل',
          href: '/admin/now/sections/payments',
          icon: Banknote,
          show: permissions.manage_finance,
        },
        {
          label: 'الخدمات والحجوزات',
          href: '/admin/now/sections/services',
          icon: Wrench,
          show: permissions.manage_catalog || permissions.manage_orders,
        },
      ],
    },
    {
      label: 'الثقة والنظام',
      items: [
        {
          label: 'التحقق والامتثال',
          href: '/admin/now/sections/compliance',
          icon: ShieldCheck,
          show: reviewVisible,
        },
        {
          label: 'الإشعارات',
          href: '/admin/now/sections/notifications',
          icon: Bell,
          show: permissions.manage_settings,
        },
        {
          label: 'إعدادات التطبيق',
          href: '/admin/now/settings',
          icon: Settings,
          show: permissions.manage_settings,
        },
        {
          label: 'إدارة النظام',
          href: '/admin/now/sections/system',
          icon: Boxes,
          show: permissions.manage_settings,
        },
      ],
    },
  ];

  const visibleItems = groups.flatMap((group) => group.items).filter((item) => item.show);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 border-l border-slate-200/80 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/admin/now" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-violet-200">
              N
            </span>
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-violet-600">
                Navienty Now
              </span>
              <span className="mt-0.5 block text-base font-black text-slate-950">لوحة التشغيل</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {groups.map((group) => {
              const items = group.items.filter((item) => item.show);

              if (items.length === 0) return null;

              return (
                <div key={group.label}>
                  <p className="mb-2 px-3 text-[10px] font-black text-slate-400">{group.label}</p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={[
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold transition',
                            active
                              ? 'bg-violet-50 text-violet-800 shadow-sm ring-1 ring-violet-100'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500',
                            ].join(' ')}
                          >
                            <Icon size={16} strokeWidth={2.2} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link
              href="/admin/now/data"
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition',
                pathname.startsWith('/admin/now/data')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              ].join(' ')}
            >
              <Database size={16} />
              أدوات البيانات المتقدمة
            </Link>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-400">مسجل كـ</p>
            <p className="mt-1 text-sm font-black text-slate-800">{roleLabel(access.now_role)}</p>
          </div>
          <Link
            href="/admin"
            className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <span>العودة للوحة Navienty</span>
            <ArrowLeft size={15} />
          </Link>
        </div>
      </aside>

      <div className="lg:pr-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-black text-white">N</span>
              <div>
                <p className="text-xs font-black text-slate-950">Navienty Now</p>
                <p className="text-[10px] font-bold text-slate-400">لوحة التشغيل</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              لوحة الإدارة متصلة
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">
              {roleLabel(access.now_role)}
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            <div className="flex min-w-max gap-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black',
                      active ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-600',
                    ].join(' ')}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
