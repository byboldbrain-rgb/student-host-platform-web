import { TrendingUp } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { Card, StatusPill, dateLabel, money, number } from '../components/finance-ui';
import { getFinanceReport } from '../lib/finance-data';

export default async function FinanceReportsPage() {
  const rows = await getFinanceReport(30);
  const activeRows = rows.filter((row) => row.completed_orders > 0 || row.operating_expenses > 0 || row.payroll_cost > 0);
  const totals = activeRows.reduce((acc, row) => ({
    orders: acc.orders + row.completed_orders,
    gmv: acc.gmv + row.gmv,
    collections: acc.collections + row.collections,
    productCost: acc.productCost + row.actual_product_cost,
    tripCost: acc.tripCost + row.trip_cost,
    payroll: acc.payroll + row.payroll_cost,
    opex: acc.opex + row.operating_expenses,
    contribution: acc.contribution + row.contribution_profit,
    operatingProfit: acc.operatingProfit + row.operating_profit,
  }), { orders: 0, gmv: 0, collections: 0, productCost: 0, tripCost: 0, payroll: 0, opex: 0, contribution: 0, operatingProfit: 0 });
  const completeDays = activeRows.filter((row) => row.missing_purchase_cost_orders === 0 && row.missing_trip_orders === 0).length;

  return <div className="space-y-5">
    <PageHeader eyebrow="Finance · CFO Pack" title="P&L وتقارير آخر 30 يوم" description="Daily P&L + Unit Economics مع Data Quality status لكل يوم. أي يوم ناقص COGS أو Trip Allocation يظهر Incomplete بدل Profit مضلل." icon={<TrendingUp size={16} />} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Orders</p><p className="mt-2 text-2xl font-semibold">{number(totals.orders,0)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">GMV</p><p className="mt-2 text-2xl font-semibold">{money(totals.gmv)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Collections</p><p className="mt-2 text-2xl font-semibold">{money(totals.collections)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Contribution*</p><p className="mt-2 text-2xl font-semibold">{money(totals.contribution)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Complete Days</p><p className="mt-2 text-2xl font-semibold">{completeDays}/{activeRows.length}</p></div></section>

    <Card title="Daily P&L" description="* إجماليات الربح لا تعتبر audited/Final إلا للأيام التي Data Quality فيها Complete.">
      <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Date</th><th className="p-3">Orders</th><th className="p-3">GMV</th><th className="p-3">Collections</th><th className="p-3">Product Cost</th><th className="p-3">Trip Cost</th><th className="p-3">Contribution</th><th className="p-3">Payroll</th><th className="p-3">OpEx</th><th className="p-3">Operating Profit</th><th className="p-3">Data Quality</th></tr></thead><tbody>{[...activeRows].reverse().map((row) => {
        const complete = row.missing_purchase_cost_orders === 0 && row.missing_trip_orders === 0;
        return <tr key={row.date} className="border-b border-gray-50"><td className="p-3 font-semibold">{dateLabel(row.date)}</td><td className="p-3">{row.completed_orders}</td><td className="p-3">{money(row.gmv)}</td><td className="p-3">{money(row.collections)}</td><td className="p-3">{money(row.actual_product_cost)}</td><td className="p-3">{money(row.trip_cost)}</td><td className={`p-3 font-semibold ${complete ? (row.contribution_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{complete ? money(row.contribution_profit) : 'مبدئي'}</td><td className="p-3">{money(row.payroll_cost)}</td><td className="p-3">{money(row.operating_expenses)}</td><td className={`p-3 font-semibold ${complete ? (row.operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{complete ? money(row.operating_profit) : 'غير مكتمل'}</td><td className="p-3"><StatusPill tone={complete ? 'success' : 'warning'}>{complete ? 'Complete' : `${row.missing_purchase_cost_orders} COGS · ${row.missing_trip_orders} Trip`}</StatusPill></td></tr>;
      })}</tbody></table>{!activeRows.length ? <div className="flex min-h-44 items-center justify-center text-sm text-gray-400">لا توجد حركة مالية خلال الفترة.</div> : null}</div>
    </Card>
  </div>;
}
