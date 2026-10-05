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
  { href: '/admin/now/finance', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/now/finance/orders', label: 'ربحية الطلبات', icon: ClipboardList },
  { href: '/admin/now/finance/riders', label: 'عهد المندوبين', icon: Bike },
  { href: '/admin/now/finance/trips', label: 'الرحلات', icon: Route },
  { href: '/admin/now/finance/team', label: 'الموظفين والحضور', icon: UsersRound },
  { href: '/admin/now/finance/payroll', label: 'الرواتب', icon: Banknote },
  { href: '/admin/now/finance/expenses', label: 'المصروفات', icon: ReceiptText },
  { href: '/admin/now/finance/cash', label: 'الكاش والمحافظ', icon: Wallet },
  { href: '/admin/now/finance/reports', label: 'التقارير', icon: TrendingUp },
] as const;

export default function FinanceNav() {
  const pathname = usePathname();
  return (
    <nav className="overflow-x-auto rounded-[22px] border border-black/[0.05] bg-white p-2 shadow-[0_6px_20px_rgba(15,23,42,0.035)]">
      <div className="flex min-w-max gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/admin/now/finance'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'inline-flex min-h-10 items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold transition',
                active ? 'bg-slate-950 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
