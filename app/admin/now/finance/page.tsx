import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  ClipboardList,
  Gauge,
  HandCoins,
  Route,
  Scale,
  TriangleAlert,
  Wallet,
} from 'lucide-react';

import { Notice, PageHeader } from '../components/ui-kit';
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
  const profitTone = !complete ? 'warning' : summary.operating_profit >= 0 ? 'positive' : 'negative';
  const maxTrend = Math.max(1, ...data.trend.map((row) => row.orders));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Navienty Now · Finance OS"
        title="مركز التحكم المالي"
        description="P&L يومي من الطلبات الفعلية، تكلفة الشراء الحقيقية، الرحلات، الرواتب والمصروفات — مع Controls تمنع اعتماد ربح ناقص التكاليف."
        icon={<Scale size={16} />}
        actions={
          <form className="flex items-center gap-2" method="get">
            <input name="date" type="date" defaultValue={date} className="h-11 rounded-[14px] border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-blue-400" />
            <button className="h-11 rounded-[14px] bg-slate-950 px-4 text-xs font-semibold text-white">عرض اليوم</button>
          </form>
        }
      />

      {!complete ? (
        <Notice tone="warning" title="الربح لسه مبدئي — التكاليف غير مكتملة">
          في {summary.missing_purchase_cost_orders} طلب بدون Actual Purchase Cost و{summary.missing_trip_orders} طلب بدون Trip Allocation. النظام لن يعتبر Operating Profit رقمًا نهائيًا ولن يسمح بإغلاق اليوم قبل استكمالهم.
        </Notice>
      ) : data.close?.status === 'closed' ? (
        <Notice tone="success" title={`اليوم المالي ${dateLabel(date)} مُغلق`}>
          تم تثبيت Snapshot اليوم {dateTimeLabel(data.close.closed_at)}. الأرقام مكتملة حسب الـcontrols الحالية.
        </Notice>
      ) : (
        <Notice tone="success" title="التكاليف الأساسية مكتملة">
          كل الطلبات المسلّمة في اليوم لها Actual Purchase Cost وTrip Allocation. راجع العهد والمصروفات ثم اقفل اليوم ماليًا.
        </Notice>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Delivered Orders" value={number(summary.completed_orders, 0)} note={dateLabel(date)} icon={<ClipboardList size={17} />} />
        <Kpi label="GMV" value={money(summary.gmv)} note="قيمة المنتجات قبل رسوم التوصيل والدفع" icon={<Gauge size={17} />} tone="blue" />
        <Kpi label="Customer Collections" value={money(summary.collections)} note={`Delivery ${money(summary.delivery_revenue)} · Fees ${money(summary.payment_fee_revenue)}`} icon={<Wallet size={17} />} />
        <Kpi label="Actual Product Cost" value={money(summary.actual_product_cost)} note={`${summary.known_purchase_orders}/${summary.completed_orders} طلب مكتمل التكلفة`} icon={<HandCoins size={17} />} tone={summary.missing_purchase_cost_orders ? 'warning' : 'neutral'} />
        <Kpi label="Trip Cost" value={money(summary.trip_cost)} note={`${summary.missing_trip_orders} طلب بدون allocation`} icon={<Route size={17} />} tone={summary.missing_trip_orders ? 'warning' : 'neutral'} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Contribution" value={complete ? money(summary.contribution_profit) : 'مبدئي'} note={complete ? `${money(summary.contribution_per_order)} / order` : money(summary.contribution_profit)} tone={complete ? (summary.contribution_profit >= 0 ? 'positive' : 'negative') : 'warning'} />
        <Kpi label="Payroll Accrual" value={money(summary.payroll_cost)} note="تكلفة الموظفين المحملة على اليوم" icon={<Banknote size={17} />} />
        <Kpi label="Operating Expenses" value={money(summary.operating_expenses)} note="مصروفات اليوم المعتمدة خارج COGS/Trips/Payroll" />
        <Kpi label="Operating Profit" value={complete ? money(summary.operating_profit) : 'غير مكتمل'} note={complete ? `${money(summary.operating_profit_per_order)} / order` : 'لن يتم اعتماد الربح قبل اكتمال التكاليف'} tone={profitTone} />
        <Kpi label="Break-even" value={complete && summary.breakeven_orders !== null ? `${number(summary.breakeven_orders, 0)} orders` : '—'} note={complete ? 'حسب Contribution الحالية وتكاليف اليوم' : 'يظهر بعد اكتمال التكاليف'} icon={<Scale size={17} />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Finance Controls" description="أي Gap هنا يمنعنا من اعتبار الربح Final.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/admin/now/finance/orders?date=${date}`} className="rounded-[20px] border border-gray-100 bg-[#fbfcfd] p-4 transition hover:border-blue-200 hover:bg-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">تكلفة شراء الطلبات</span>
                <StatusPill tone={summary.missing_purchase_cost_orders ? 'warning' : 'success'}>{summary.missing_purchase_cost_orders ? `${summary.missing_purchase_cost_orders} ناقص` : 'مكتمل'}</StatusPill>
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">سعر الشراء الحقيقي هو COGS، مش السعر اللي ظاهر للعميل.</p>
            </Link>
            <Link href={`/admin/now/finance/trips?date=${date}`} className="rounded-[20px] border border-gray-100 bg-[#fbfcfd] p-4 transition hover:border-blue-200 hover:bg-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">Maallemeen → Hadaba</span>
                <StatusPill tone={summary.missing_trip_orders ? 'warning' : 'success'}>{summary.missing_trip_orders ? `${summary.missing_trip_orders} ناقص` : 'مكتمل'}</StatusPill>
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">تكلفة كل رحلة تتوزع على Orders الموجودة فيها بدل ما تضيع كمصروف عام.</p>
            </Link>
            <Link href={`/admin/now/finance/riders?date=${date}`} className="rounded-[20px] border border-gray-100 bg-[#fbfcfd] p-4 transition hover:border-blue-200 hover:bg-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">عهد غير مسوّاة</span>
                <StatusPill tone={data.openRiderCash > 0 ? 'warning' : 'success'}>{money(data.openRiderCash)}</StatusPill>
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">الفلوس المرسلة للمندوب Asset/Advance لحد ما تتسوى بالمشتريات والكاش المرتجع.</p>
            </Link>
            <div className="rounded-[20px] border border-gray-100 bg-[#fbfcfd] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-900">Daily Close</span>
                <StatusPill tone={data.close?.status === 'closed' ? 'success' : 'neutral'}>{data.close?.status === 'closed' ? 'Closed' : 'Open'}</StatusPill>
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-500">بعد الإغلاق بنحفظ Snapshot للـP&L علشان كل يوم يبقى قابل للمراجعة.</p>
              {data.close?.status !== 'closed' ? (
                <form action={closeFinanceDayAction} className="mt-3">
                  <input type="hidden" name="close_date" value={date} />
                  <button className={primaryButton} disabled={!complete || data.openRiderCash > 0}>
                    <CircleCheck size={14} /> إغلاق اليوم ماليًا
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </Card>

        <Card title="آخر 7 أيام" description="Orders اليومية؛ الربح يظل مبدئيًا في الأيام اللي تكلفتها ناقصة.">
          <div className="space-y-3">
            {data.trend.map((row) => (
              <div key={row.date}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold text-gray-600">
                  <span>{dateLabel(row.date)}</span>
                  <span>{row.orders} orders</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, (row.orders / maxTrend) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card
        title="آخر الطلبات المسلّمة"
        description="Unit economics على مستوى كل Order. Profit لا يعتبر Final لو cost_complete = false."
        action={<Link href={`/admin/now/finance/orders?date=${date}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">كل الطلبات <ArrowLeft size={13} /></Link>}
      >
        {data.economics.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-xs">
              <thead><tr className="border-b border-gray-100 text-[10px] uppercase tracking-[0.06em] text-gray-400"><th className="px-3 py-3">Order</th><th className="px-3 py-3">Store</th><th className="px-3 py-3">Collected</th><th className="px-3 py-3">Product Cost</th><th className="px-3 py-3">Trip</th><th className="px-3 py-3">Contribution</th><th className="px-3 py-3">Control</th></tr></thead>
              <tbody>
                {data.economics.map((order) => (
                  <tr key={order.order_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-3 font-semibold text-gray-900">{order.order_code}</td>
                    <td className="px-3 py-3 font-medium text-gray-600">{order.store_name}</td>
                    <td className="px-3 py-3 font-semibold">{money(order.total_amount)}</td>
                    <td className="px-3 py-3">{money(order.actual_product_cost)}</td>
                    <td className="px-3 py-3">{money(order.trip_cost)}</td>
                    <td className={`px-3 py-3 font-semibold ${order.cost_complete ? (order.contribution_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{order.cost_complete ? money(order.contribution_profit) : 'مبدئي'}</td>
                    <td className="px-3 py-3"><StatusPill tone={order.cost_complete ? 'success' : 'warning'}>{order.cost_complete ? 'Complete' : 'Missing cost'}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-36 items-center justify-center text-sm font-medium text-gray-400">لا توجد Orders delivered في اليوم المحدد.</div>
        )}
      </Card>

      {!complete ? (
        <div className="flex items-center gap-2 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          <TriangleAlert size={15} /> الأرقام الخضراء لا تعني Profit حقيقي قبل استكمال Actual Cost وTrip Allocation لكل Order.
        </div>
      ) : null}
    </div>
  );
}
