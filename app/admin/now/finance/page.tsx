import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpLeft,
  Banknote,
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardList,
  Coins,
  HandCoins,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Wallet,
} from 'lucide-react';

import { closeFinanceDayAction } from './actions';
import { Card, Kpi, StatusPill, dateLabel, dateTimeLabel, money, number, primaryButton } from './components/finance-ui';
import { getFinanceDashboard, normalizeDate } from './lib/finance-data';

export default async function FinanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const data = await getFinanceDashboard(date);
  const { summary } = data;
  const complete = summary.missing_purchase_cost_orders === 0 && summary.missing_trip_orders === 0;
  const closed = data.close?.status === 'closed';
  const profitPositive = summary.operating_profit >= 0;
  const maxCollections = Math.max(1, ...data.trend.map((row) => row.collections));
  const maxOrders = Math.max(1, ...data.trend.map((row) => row.orders));
  const chartPoints = data.trend.map((row, index) => {
    const x = index * (100 / Math.max(1, data.trend.length - 1));
    const y = 38 - (row.collections / maxCollections) * 30;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const averageOrder = summary.completed_orders ? summary.gmv / summary.completed_orders : 0;
  const productMargin = summary.collections - summary.actual_product_cost;
  const readinessChecks = [
    { label: 'Actual purchase costs', detail: `${summary.known_purchase_orders}/${summary.completed_orders} orders`, ok: summary.missing_purchase_cost_orders === 0, href: `/admin/now/finance/orders?date=${date}` },
    { label: 'Trip allocation', detail: summary.missing_trip_orders ? `${summary.missing_trip_orders} orders missing` : 'All delivered orders allocated', ok: summary.missing_trip_orders === 0, href: `/admin/now/finance/trips?date=${date}` },
    { label: 'Rider cash', detail: data.openRiderCash > 0 ? `${money(data.openRiderCash)} outstanding` : 'No open rider advances', ok: data.openRiderCash === 0, href: `/admin/now/finance/riders?date=${date}` },
  ];

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative p-6 md:p-8 lg:p-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  <Sparkles size={12} /> Executive Finance
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${closed ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : complete ? 'border-blue-400/20 bg-blue-400/10 text-blue-200' : 'border-amber-300/20 bg-amber-300/10 text-amber-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${closed ? 'bg-emerald-400' : complete ? 'bg-blue-400' : 'bg-amber-300'}`} />
                  {closed ? 'Day closed' : complete ? 'Ready to close' : 'Data incomplete'}
                </span>
              </div>
              <h1 className="mt-5 text-[30px] font-bold tracking-[-0.04em] sm:text-[38px]">مركز التحكم المالي</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-400">
                صورة واحدة واضحة لربحية Navienty Now: الطلبات، تكلفة الشراء الفعلية، الرحلات، الرواتب، المصروفات والسيولة.
              </p>
            </div>

            <form className="flex shrink-0 items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur" method="get">
              <span className="hidden h-9 w-9 items-center justify-center text-slate-400 sm:flex"><CalendarDays size={16} /></span>
              <input name="date" type="date" defaultValue={date} className="h-10 rounded-[11px] border-0 bg-white/[0.08] px-3 text-xs font-bold text-white outline-none [color-scheme:dark]" />
              <button className="h-10 rounded-[11px] bg-white px-4 text-xs font-bold text-slate-950 transition hover:bg-slate-100">عرض</button>
            </form>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_.75fr_.75fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Operating profit · {dateLabel(date)}</p>
                  <div className={`mt-3 text-[38px] font-bold tracking-[-0.055em] sm:text-[48px] ${!complete ? 'text-amber-300' : profitPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {complete ? money(summary.operating_profit) : 'Pending'}
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-slate-400">
                    {complete ? `${money(summary.operating_profit_per_order)} net profit / order` : `${summary.missing_purchase_cost_orders} COGS + ${summary.missing_trip_orders} trip allocations missing`}
                  </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${!complete ? 'bg-amber-300/10 text-amber-300' : profitPositive ? 'bg-emerald-300/10 text-emerald-300' : 'bg-rose-300/10 text-rose-300'}`}>
                  {complete ? <ArrowUpLeft size={20} /> : <TriangleAlert size={19} />}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5">
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Orders</p><p className="mt-1.5 text-lg font-bold">{number(summary.completed_orders, 0)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">GMV</p><p className="mt-1.5 text-lg font-bold">{money(summary.gmv)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">AOV</p><p className="mt-1.5 text-lg font-bold">{money(averageOrder)}</p></div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Contribution</p><Coins size={16} className="text-blue-300" /></div>
              <p className={`mt-5 text-[31px] font-bold tracking-[-0.04em] ${complete ? (summary.contribution_profit >= 0 ? 'text-white' : 'text-rose-300') : 'text-amber-300'}`}>{complete ? money(summary.contribution_profit) : 'Pending'}</p>
              <p className="mt-2 text-[11px] font-medium text-slate-400">{complete ? `${money(summary.contribution_per_order)} / order` : 'Waiting for variable costs'}</p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, Math.max(4, summary.collections ? (Math.max(0, summary.contribution_profit) / summary.collections) * 100 : 4))}%` }} /></div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Break-even</p><Target size={16} className="text-emerald-300" /></div>
              <p className="mt-5 text-[31px] font-bold tracking-[-0.04em]">{complete && summary.breakeven_orders !== null ? number(summary.breakeven_orders, 0) : '—'}</p>
              <p className="mt-2 text-[11px] font-medium text-slate-400">orders required today</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-400"><span className={`h-2 w-2 rounded-full ${complete && summary.breakeven_orders !== null && summary.completed_orders >= summary.breakeven_orders ? 'bg-emerald-400' : 'bg-slate-600'}`} />{complete && summary.breakeven_orders !== null ? `${Math.max(0, summary.breakeven_orders - summary.completed_orders)} orders gap` : 'Available after cost completion'}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Customer collections" value={money(summary.collections)} note={`Delivery ${money(summary.delivery_revenue)} · Fees ${money(summary.payment_fee_revenue)}`} icon={<Wallet size={17} />} tone="blue" />
        <Kpi label="Actual product cost" value={money(summary.actual_product_cost)} note={`${summary.known_purchase_orders}/${summary.completed_orders} orders costed`} icon={<HandCoins size={17} />} tone={summary.missing_purchase_cost_orders ? 'warning' : 'neutral'} />
        <Kpi label="Trip cost" value={money(summary.trip_cost)} note={summary.missing_trip_orders ? `${summary.missing_trip_orders} orders need allocation` : 'All trips allocated'} icon={<Route size={17} />} tone={summary.missing_trip_orders ? 'warning' : 'neutral'} />
        <Kpi label="Payroll accrual" value={money(summary.payroll_cost)} note={`${data.activeEmployees} active employees`} icon={<Banknote size={17} />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_.9fr]">
        <Card title="7-day operating pulse" description="Customer collections with daily order volume. The chart is operational context, not audited profit.">
          <div className="rounded-[18px] bg-slate-50/80 px-3 pb-3 pt-5 sm:px-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Collections trend</p><p className="mt-1 text-sm font-bold text-slate-950">{money(data.trend.reduce((sum, row) => sum + row.collections, 0))} <span className="text-[10px] font-medium text-slate-400">last 7 days</span></p></div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-600" /> Collections</div>
            </div>
            <div className="relative h-[210px] w-full" dir="ltr">
              <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200/70" />
              <div className="absolute inset-x-0 bottom-8 h-px bg-slate-200" />
              <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="absolute inset-x-0 top-1 h-[160px] w-full overflow-visible">
                <defs><linearGradient id="financeArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.18" /><stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0" /></linearGradient></defs>
                <polygon points={`0,40 ${chartPoints} 100,40`} fill="url(#financeArea)" />
                <polyline points={chartPoints} fill="none" stroke="rgb(37 99 235)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {data.trend.map((row, index) => {
                  const x = index * (100 / Math.max(1, data.trend.length - 1));
                  const y = 38 - (row.collections / maxCollections) * 30;
                  return <circle key={row.date} cx={x} cy={y} r="1.1" fill="white" stroke="rgb(37 99 235)" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
                })}
              </svg>
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 gap-1">
                {data.trend.map((row) => <div key={row.date} className="text-center"><div className="mx-auto mb-1.5 flex h-7 items-end justify-center"><div className="w-2 rounded-t-sm bg-slate-300" style={{ height: `${Math.max(3, (row.orders / maxOrders) * 28)}px` }} /></div><p className="text-[9px] font-bold text-slate-400">{row.date.slice(5)}</p></div>)}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Daily close readiness" description="The day only becomes finance-grade when every operational cost is accounted for.">
          <div className="space-y-1">
            {readinessChecks.map((check) => (
              <Link key={check.label} href={check.href} className="group flex items-center gap-3 rounded-[15px] px-3 py-3 transition hover:bg-slate-50">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${check.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>{check.ok ? <Check size={15} strokeWidth={2.5} /> : <TriangleAlert size={14} />}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-900">{check.label}</span><span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{check.detail}</span></span>
                <ArrowLeft size={13} className="text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-slate-600" />
              </Link>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-950">Finance day</p><p className="mt-1 text-[10px] font-medium text-slate-500">{closed ? `Closed ${dateTimeLabel(data.close?.closed_at)}` : 'Open — snapshot not locked yet'}</p></div><StatusPill tone={closed ? 'success' : complete && data.openRiderCash === 0 ? 'blue' : 'warning'}>{closed ? 'Closed' : complete && data.openRiderCash === 0 ? 'Ready' : 'Open'}</StatusPill></div>
            {!closed ? <form action={closeFinanceDayAction} className="mt-4"><input type="hidden" name="close_date" value={date} /><button className={`${primaryButton} w-full`} disabled={!complete || data.openRiderCash > 0}><CircleCheck size={14} /> Close finance day</button></form> : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card title="Unit economics bridge" description="How customer collections move through direct operating costs to daily operating profit.">
          <div className="space-y-4">
            {[
              { label: 'Customer collections', value: summary.collections, tone: 'text-slate-950', bar: 100 },
              { label: 'Actual product cost', value: -summary.actual_product_cost, tone: 'text-rose-600', bar: summary.collections ? (summary.actual_product_cost / summary.collections) * 100 : 0 },
              { label: 'Trip & variable cost', value: -(summary.trip_cost + summary.other_variable_cost), tone: 'text-rose-600', bar: summary.collections ? ((summary.trip_cost + summary.other_variable_cost) / summary.collections) * 100 : 0 },
              { label: 'Payroll', value: -summary.payroll_cost, tone: 'text-rose-600', bar: summary.collections ? (summary.payroll_cost / summary.collections) * 100 : 0 },
              { label: 'Operating expenses', value: -summary.operating_expenses, tone: 'text-rose-600', bar: summary.collections ? (summary.operating_expenses / summary.collections) * 100 : 0 },
            ].map((row) => <div key={row.label}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-slate-600">{row.label}</span><span className={`text-[11px] font-bold ${row.tone}`}>{row.value < 0 ? '−' : ''}{money(Math.abs(row.value))}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.value < 0 ? 'bg-slate-300' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, Math.max(row.value === 0 ? 0 : 3, row.bar))}%` }} /></div></div>)}
            <div className="flex items-center justify-between rounded-[16px] bg-slate-950 px-4 py-4 text-white"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Operating profit</p><p className="mt-1 text-xs font-medium text-slate-400">after direct costs, payroll and OpEx</p></div><p className={`text-xl font-bold ${!complete ? 'text-amber-300' : profitPositive ? 'text-emerald-300' : 'text-rose-300'}`}>{complete ? money(summary.operating_profit) : 'Pending'}</p></div>
          </div>
        </Card>

        <Card title="Cost intelligence" description="The few numbers a CFO should watch before changing price, routing or staffing.">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[17px] bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Product spread</p><p className={`mt-2 text-xl font-bold ${productMargin >= 0 ? 'text-slate-950' : 'text-rose-700'}`}>{money(productMargin)}</p><p className="mt-1 text-[10px] font-medium text-slate-500">collections − actual COGS</p></div>
            <div className="rounded-[17px] bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Trip / order</p><p className="mt-2 text-xl font-bold text-slate-950">{money(summary.completed_orders ? summary.trip_cost / summary.completed_orders : 0)}</p><p className="mt-1 text-[10px] font-medium text-slate-500">line-haul allocation</p></div>
            <div className="rounded-[17px] bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Payroll / order</p><p className="mt-2 text-xl font-bold text-slate-950">{money(summary.completed_orders ? summary.payroll_cost / summary.completed_orders : 0)}</p><p className="mt-1 text-[10px] font-medium text-slate-500">daily people cost</p></div>
            <div className="rounded-[17px] bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Open rider cash</p><p className={`mt-2 text-xl font-bold ${data.openRiderCash > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{money(data.openRiderCash)}</p><p className="mt-1 text-[10px] font-medium text-slate-500">unsettled advances</p></div>
          </div>
        </Card>
      </section>

      <Card
        title="Latest delivered orders"
        description="Order-level economics. A contribution number is only final after both actual purchase cost and trip allocation are complete."
        action={<Link href={`/admin/now/finance/orders?date=${date}`} className="inline-flex items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50">View all <ArrowLeft size={12} /></Link>}
      >
        {data.economics.length ? (
          <div className="overflow-x-auto -mx-5 -mb-5 md:-mx-6 md:-mb-6">
            <table className="w-full min-w-[900px] text-right text-xs">
              <thead><tr className="border-y border-slate-100 bg-slate-50/70 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400"><th className="px-6 py-3">Order</th><th className="px-4 py-3">Store</th><th className="px-4 py-3">Collected</th><th className="px-4 py-3">Product cost</th><th className="px-4 py-3">Trip</th><th className="px-4 py-3">Contribution</th><th className="px-6 py-3">Control</th></tr></thead>
              <tbody>
                {data.economics.map((order) => (
                  <tr key={order.order_id} className="border-b border-slate-100/80 last:border-0 transition hover:bg-slate-50/60">
                    <td className="px-6 py-4"><p className="font-bold text-slate-950">{order.order_code}</p></td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{order.store_name}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{money(order.total_amount)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{money(order.actual_product_cost)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{money(order.trip_cost)}</td>
                    <td className={`px-4 py-4 font-bold ${order.cost_complete ? (order.contribution_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{order.cost_complete ? money(order.contribution_profit) : 'Pending'}</td>
                    <td className="px-6 py-4"><StatusPill tone={order.cost_complete ? 'success' : 'warning'}>{order.cost_complete ? 'Complete' : 'Missing cost'}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center text-center"><ClipboardList size={22} className="text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">No delivered orders</p><p className="mt-1 text-[11px] font-medium text-slate-400">There are no delivered orders for this date.</p></div>
        )}
      </Card>

      {!complete ? (
        <div className="flex items-start gap-3 rounded-[18px] border border-amber-200/70 bg-amber-50 px-4 py-3.5 text-xs font-semibold text-amber-950">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
          <div><p className="font-bold">Profit protection is active</p><p className="mt-1 text-[11px] font-medium leading-5 text-amber-800">Navienty will not treat today&apos;s profit as final until every delivered order has actual purchase cost and trip allocation.</p></div>
        </div>
      ) : null}
    </div>
  );
}
