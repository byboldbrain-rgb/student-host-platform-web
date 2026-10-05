import { TrendingUp } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { Card, StatusPill, dateLabel, money, number } from '../components/finance-ui';
import { getFinanceReport } from '../lib/finance-data';

export default async function FinanceReportsPage() {
  const rows = await getFinanceReport(30);
  const activeRows = rows.filter((row) => row.completed_orders > 0 || row.operating_expenses > 0);
  const completeRows = activeRows.filter((row) => row.missing_purchase_cost_orders === 0 && row.missing_trip_orders === 0);

  const totals = activeRows.reduce((acc, row) => ({
    orders: acc.orders + row.completed_orders,
    gmv: acc.gmv + row.gmv,
    collections: acc.collections + row.collections,
    operatingExpenses: acc.operatingExpenses + row.operating_expenses,
  }), { orders: 0, gmv: 0, collections: 0, operatingExpenses: 0 });

  const finalTotals = completeRows.reduce((acc, row) => ({
    contribution: acc.contribution + row.contribution_profit,
    operatingProfit: acc.operatingProfit + row.operating_profit,
  }), { contribution: 0, operatingProfit: 0 });

  return <div className="space-y-5">
    <PageHeader eyebrow="Finance · CFO Pack" title="P&L وتقارير آخر 30 يوم" description="Operating Expenses هنا شاملة Payroll. Daily P&L يفضل Incomplete لو Actual Product Cost أو Trip Allocation ناقصين." icon={<TrendingUp size={16} />} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Orders</p><p className="mt-2 text-2xl font-semibold">{number(totals.orders,0)}</p></div>
      <div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">GMV</p><p className="mt-2 text-2xl font-semibold">{money(totals.gmv)}</p></div>
      <div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Operating Expenses</p><p className="mt-2 text-2xl font-semibold">{money(totals.operatingExpenses)}</p><p className="mt-1 text-[10px] font-medium text-gray-400">Includes payroll</p></div>
      <div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Final Contribution</p><p className="mt-2 text-2xl font-semibold">{completeRows.length ? money(finalTotals.contribution) : '—'}</p><p className="mt-1 text-[10px] font-medium text-gray-400">Complete days only</p></div>
      <div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Complete Days</p><p className="mt-2 text-2xl font-semibold">{completeRows.length}/{activeRows.length}</p><p className="mt-1 text-[10px] font-medium text-gray-400">Final operating profit: {completeRows.length ? money(finalTotals.operatingProfit) : '—'}</p></div>
    </section>

    <Card title="Daily P&L" description="Total OpEx = Payroll + باقي المصروفات التشغيلية. Operating Profit بيخصم Total OpEx مرة واحدة فقط.">
      <div className="overflow-x-auto"><table className="w-full min-w-[1240px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Date</th><th className="p-3">Orders</th><th className="p-3">GMV</th><th className="p-3">Collections</th><th className="p-3">Product Cost</th><th className="p-3">Trip Cost</th><th className="p-3">Contribution</th><th className="p-3">Payroll</th><th className="p-3">Other OpEx</th><th className="p-3">Total OpEx</th><th className="p-3">Operating Profit</th><th className="p-3">Data Quality</th></tr></thead><tbody>{[...activeRows].reverse().map((row) => {
        const complete = row.missing_purchase_cost_orders === 0 && row.missing_trip_orders === 0;
        const otherOpex = Math.max(0, row.operating_expenses - row.payroll_cost);
        return <tr key={row.date} className="border-b border-gray-50"><td className="p-3 font-semibold">{dateLabel(row.date)}</td><td className="p-3">{row.completed_orders}</td><td className="p-3">{money(row.gmv)}</td><td className="p-3">{money(row.collections)}</td><td className="p-3">{money(row.actual_product_cost)}</td><td className="p-3">{money(row.trip_cost)}</td><td className={`p-3 font-semibold ${complete ? (row.contribution_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{complete ? money(row.contribution_profit) : 'مبدئي'}</td><td className="p-3">{money(row.payroll_cost)}</td><td className="p-3">{money(otherOpex)}</td><td className="p-3 font-semibold">{money(row.operating_expenses)}</td><td className={`p-3 font-semibold ${complete ? (row.operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{complete ? money(row.operating_profit) : 'غير مكتمل'}</td><td className="p-3"><StatusPill tone={complete ? 'success' : 'warning'}>{complete ? 'Complete' : `${row.missing_purchase_cost_orders} COGS · ${row.missing_trip_orders} Trip`}</StatusPill></td></tr>;
      })}</tbody></table>{!activeRows.length ? <div className="flex min-h-44 items-center justify-center text-sm text-gray-400">لا توجد حركة مالية خلال الفترة.</div> : null}</div>
    </Card>
  </div>;
}
