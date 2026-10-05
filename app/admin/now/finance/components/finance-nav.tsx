'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  Bike,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Route,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react';

const items = [
  { href: '/admin/now/finance', label: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/now/finance/orders', label: 'Orders', ar: 'ربحية الطلبات', icon: ClipboardList },
  { href: '/admin/now/finance/riders', label: 'Riders', ar: 'عهد المندوبين', icon: Bike },
  { href: '/admin/now/finance/trips', label: 'Trips', ar: 'الرحلات', icon: Route },
  { href: '/admin/now/finance/team', label: 'Team', ar: 'الموظفين والحضور', icon: UsersRound },
  { href: '/admin/now/finance/payroll', label: 'Payroll', ar: 'الرواتب', icon: Banknote },
  { href: '/admin/now/finance/expenses', label: 'Expenses', ar: 'المصروفات', icon: ReceiptText },
  { href: '/admin/now/finance/cash', label: 'Treasury', ar: 'الكاش والمحافظ', icon: Wallet },
  { href: '/admin/now/finance/reports', label: 'Reports', ar: 'التقارير', icon: TrendingUp },
] as const;

export default function FinanceNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-[72px] z-30 -mx-4 border-y border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-xl md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="hidden shrink-0 items-center gap-3 border-l border-slate-200 pl-4 xl:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-slate-950 text-white shadow-sm">
            <Banknote size={16} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-extrabold tracking-[-0.01em] text-slate-950">Finance OS</p>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Navienty Now</p>
          </div>
        </div>

        <nav className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/admin/now/finance'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.ar}
                  className={[
                    'group inline-flex min-h-10 items-center gap-2 rounded-[11px] px-3 py-2 text-[11px] font-bold transition-all duration-150',
                    active
                      ? 'bg-slate-950 text-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')}
                >
                  <Icon size={14} strokeWidth={2.1} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
