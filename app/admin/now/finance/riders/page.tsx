import { Bike, CircleCheck, HandCoins } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { addRiderAdvanceAction, closeRiderSettlementAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton, dateTimeLabel } from '../components/finance-ui';
import { getRiderFinance, normalizeDate } from '../lib/finance-data';

export default async function RiderFinancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const data = await getRiderFinance(date);
  const riderById = new Map(data.riders.map((rider) => [rider.id, rider]));

  const unsettledByRider = new Map<string, number>();
  for (const row of data.advances) {
    if (!row.settled) unsettledByRider.set(row.rider_employee_id, (unsettledByRider.get(row.rider_employee_id) ?? 0) + Number(row.amount ?? 0));
  }
  const purchasesByRider = new Map<string, number>();
  for (const row of data.costs) {
    if (row.settlement_id) continue;
    purchasesByRider.set(row.rider_employee_id, (purchasesByRider.get(row.rider_employee_id) ?? 0) + Number(row.actual_product_cost ?? 0));
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Finance · Rider Cash" title="عهد ومحاسبة مندوبي الشراء" description="أي فلوس بتتبعت للمندوب تتسجل Advance وليست Expense. عند التسوية بنطابق العهدة مع Actual Purchases والكاش المرتجع." icon={<Bike size={16} />} actions={<form method="get" className="flex gap-2"><input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض</button></form>} />

      <section className="grid gap-4 xl:grid-cols-[.85fr_1.4fr]">
        <Card title="إرسال عهدة" description="سجّل كل تحويل للمندوب وقت حدوثه.">
          {data.riders.length ? (
            <form action={addRiderAdvanceAction} className="space-y-3">
              <label className={financeLabel}>المندوب<select required name="rider_employee_id" className={financeInput}><option value="">اختر</option>{data.riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.full_name}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><label className={financeLabel}>المبلغ<input required min="0.01" step="0.01" name="amount" type="number" className={financeInput} /></label><label className={financeLabel}>طريقة التحويل<select name="payment_method" className={financeInput}><option value="InstaPay">InstaPay</option><option value="Vodafone Cash">Vodafone Cash</option><option value="Cash">Cash</option><option value="Other">Other</option></select></label></div>
              <label className={financeLabel}>Reference<input name="reference" className={financeInput} placeholder="رقم التحويل إن وجد" /></label>
              <label className={financeLabel}>ملاحظة<textarea name="notes" className={financeTextarea} /></label>
              <button className={primaryButton}><HandCoins size={14} /> تسجيل العهدة</button>
            </form>
          ) : <p className="text-sm font-medium text-gray-500">أضف Pickup Riders من صفحة الموظفين أولًا.</p>}
        </Card>

        <Card title="Rider Exposure" description="رصيد العهد غير المسواة مقابل المشتريات غير المسواة فقط لكل مندوب.">
          <div className="grid gap-3 md:grid-cols-2">
            {data.riders.map((rider) => {
              const advances = unsettledByRider.get(rider.id) ?? 0;
              const purchases = purchasesByRider.get(rider.id) ?? 0;
              const expected = advances - purchases;
              const settlement = data.settlements.find((row) => row.rider_employee_id === rider.id);
              return (
                <div key={rider.id} className="rounded-[20px] border border-gray-100 bg-[#fcfcfd] p-4">
                  <div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-gray-950">{rider.full_name}</p><p className="mt-1 text-[10px] font-medium text-gray-400">Pickup Rider</p></div><StatusPill tone={settlement?.status === 'closed' && advances === 0 && purchases === 0 ? 'success' : advances > 0 || purchases > 0 ? 'warning' : 'neutral'}>{settlement?.status === 'closed' && advances === 0 && purchases === 0 ? 'Settled today' : advances > 0 || purchases > 0 ? 'Open' : 'No exposure'}</StatusPill></div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-[14px] bg-white p-2.5"><p className="text-[9px] font-semibold uppercase text-gray-400">Advances</p><p className="mt-1 text-xs font-semibold">{money(advances)}</p></div><div className="rounded-[14px] bg-white p-2.5"><p className="text-[9px] font-semibold uppercase text-gray-400">Purchases</p><p className="mt-1 text-xs font-semibold">{money(purchases)}</p></div><div className="rounded-[14px] bg-white p-2.5"><p className="text-[9px] font-semibold uppercase text-gray-400">Expected Cash</p><p className={`mt-1 text-xs font-semibold ${expected < 0 ? 'text-rose-700' : ''}`}>{money(expected)}</p></div></div>
                  {(advances > 0 || purchases > 0) ? (
                    <form action={closeRiderSettlementAction} className="mt-4 border-t border-gray-100 pt-4">
                      <input type="hidden" name="rider_employee_id" value={rider.id} /><input type="hidden" name="settlement_date" value={date} />
                      <label className={financeLabel}>الكاش المرتجع فعليًا<input required step="0.01" name="actual_return_amount" type="number" defaultValue={Math.max(0, expected)} className={financeInput} /></label>
                      <label className={`${financeLabel} mt-2`}>Notes<input name="notes" className={financeInput} /></label>
                      <button className={`${primaryButton} mt-3`}><CircleCheck size={14} /> Close Settlement</button>
                    </form>
                  ) : settlement ? <div className="mt-3 text-[11px] font-semibold text-emerald-700">Latest variance: {money(settlement.variance_amount)}</div> : null}
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Card title="آخر العهد" description="Audit trail للتحويلات للمندوبين.">
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Time</th><th className="p-3">Rider</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Status</th></tr></thead><tbody>{data.advances.map((row) => <tr key={row.id} className="border-b border-gray-50"><td className="p-3">{dateTimeLabel(row.sent_at)}</td><td className="p-3 font-semibold">{riderById.get(row.rider_employee_id)?.full_name ?? '—'}</td><td className="p-3 font-semibold">{money(row.amount)}</td><td className="p-3">{row.payment_method ?? '—'}</td><td className="p-3">{row.reference ?? '—'}</td><td className="p-3"><StatusPill tone={row.settled ? 'success' : 'warning'}>{row.settled ? 'Settled' : 'Open'}</StatusPill></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
