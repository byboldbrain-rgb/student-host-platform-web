import { CircleCheck, Receipt, TriangleAlert } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { saveOrderCostAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton } from '../components/finance-ui';
import { getEmployees, getOrderEconomics, normalizeDate, requireFinanceAdmin } from '../lib/finance-data';

export default async function FinanceOrdersPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const orders = await getOrderEconomics(date, 250);
  const riders = (await getEmployees(false)).filter((employee) => employee.role === 'pickup_rider');
  const { admin } = await requireFinanceAdmin();
  const ids = orders.map((order) => order.order_id);
  const costResult = ids.length
    ? await admin.schema('now').from('finance_order_costs').select('*').in('order_id', ids)
    : { data: [], error: null };
  if (costResult.error) throw new Error(costResult.error.message);
  const costs = new Map((costResult.data ?? []).map((row) => [row.order_id, row]));
  const complete = orders.filter((order) => order.cost_complete).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finance · Unit Economics"
        title="ربحية كل Order"
        description="دخل العميل معروف تلقائيًا من التطبيق. هنا نسجل Actual Purchase Cost وباقي التكاليف الفعلية علشان نعرف Contribution الحقيقي لكل طلب."
        icon={<Receipt size={16} />}
        actions={
          <form method="get" className="flex gap-2">
            <input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} />
            <button className={primaryButton}>عرض</button>
          </form>
        }
      />

      <div className={`rounded-[20px] border px-4 py-3 text-xs font-semibold ${complete === orders.length ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <div className="flex items-center gap-2">
          {complete === orders.length ? <CircleCheck size={15} /> : <TriangleAlert size={15} />}
          {orders.length ? `${complete} من ${orders.length} Orders تكلفتها مكتملة.` : 'لا توجد Orders delivered في اليوم المحدد.'}
        </div>
      </div>

      <Card title="Orders Economics" description="افتح أي Order لإدخال تكلفة الشراء الحقيقية. Trip Cost يدخل تلقائيًا من صفحة الرحلات.">
        <div className="space-y-3">
          {orders.map((order) => {
            const cost = costs.get(order.order_id);
            return (
              <details key={order.order_id} className="group rounded-[22px] border border-gray-100 bg-[#fcfcfd] open:bg-white open:shadow-sm">
                <summary className="grid cursor-pointer list-none gap-3 p-4 sm:grid-cols-[1.15fr_1fr_repeat(4,.85fr)] sm:items-center">
                  <div>
                    <p className="font-semibold text-gray-950">{order.order_code}</p>
                    <p className="mt-1 text-[11px] font-medium text-gray-500">{order.store_name}</p>
                  </div>
                  <div><p className="text-[10px] font-semibold uppercase text-gray-400">Customer paid</p><p className="mt-1 font-semibold">{money(order.total_amount)}</p></div>
                  <div><p className="text-[10px] font-semibold uppercase text-gray-400">Product cost</p><p className="mt-1 font-semibold">{money(order.actual_product_cost)}</p></div>
                  <div><p className="text-[10px] font-semibold uppercase text-gray-400">Trip</p><p className="mt-1 font-semibold">{money(order.trip_cost)}</p></div>
                  <div><p className="text-[10px] font-semibold uppercase text-gray-400">Contribution</p><p className={`mt-1 font-semibold ${order.cost_complete ? (order.contribution_profit >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-700'}`}>{order.cost_complete ? money(order.contribution_profit) : 'مبدئي'}</p></div>
                  <div className="sm:text-left"><StatusPill tone={order.cost_complete ? 'success' : 'warning'}>{order.cost_complete ? 'Complete' : 'Needs cost'}</StatusPill></div>
                </summary>

                <form action={saveOrderCostAction} className="border-t border-gray-100 p-4 md:p-5">
                  <input type="hidden" name="order_id" value={order.order_id} />
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                    <label className={financeLabel}>Actual Product Cost (EGP)<input required min="0" step="0.01" name="actual_product_cost" type="number" defaultValue={cost?.actual_product_cost ?? ''} className={financeInput} placeholder="مثال 420" /></label>
                    <label className={financeLabel}>Pickup Rider<select name="rider_employee_id" defaultValue={cost?.rider_employee_id ?? ''} className={financeInput}><option value="">بدون تحديد</option>{riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.full_name}</option>)}</select></label>
                    <label className={financeLabel}>Packaging<input min="0" step="0.01" name="packaging_cost" type="number" defaultValue={cost?.packaging_cost ?? 0} className={financeInput} /></label>
                    <label className={financeLabel}>Pickup Cost<input min="0" step="0.01" name="pickup_cost" type="number" defaultValue={cost?.pickup_cost ?? 0} className={financeInput} /></label>
                    <label className={financeLabel}>Gateway Cost<input min="0" step="0.01" name="payment_gateway_cost" type="number" defaultValue={cost?.payment_gateway_cost ?? 0} className={financeInput} /></label>
                    <label className={financeLabel}>Refund Cost<input min="0" step="0.01" name="refund_cost" type="number" defaultValue={cost?.refund_cost ?? 0} className={financeInput} /></label>
                    <label className={financeLabel}>Other Variable Cost<input min="0" step="0.01" name="other_variable_cost" type="number" defaultValue={cost?.other_variable_cost ?? 0} className={financeInput} /></label>
                    <label className={financeLabel}>Receipt URL<input name="receipt_url" type="url" defaultValue={cost?.receipt_url ?? ''} className={financeInput} placeholder="https://..." /></label>
                  </div>
                  <label className={`${financeLabel} mt-3`}>Notes<textarea name="notes" defaultValue={cost?.notes ?? ''} className={financeTextarea} placeholder="أي فرق سعر أو ملاحظة على الشراء" /></label>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-gray-500">Customer catalog price لا يستخدم كـCost. سجّل اللي اتدفع فعليًا للمحل.</p>
                    <button className={primaryButton}><CircleCheck size={14} /> حفظ التكلفة</button>
                  </div>
                </form>
              </details>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
