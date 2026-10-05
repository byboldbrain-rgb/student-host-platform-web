import { Route, Truck } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { createTripAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton } from '../components/finance-ui';
import { getEmployees, getOrderEconomics, getTrips, normalizeDate } from '../lib/finance-data';

export default async function TripsFinancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const [tripData, orders, employees] = await Promise.all([getTrips(date), getOrderEconomics(date, 250), getEmployees(false)]);
  const allocatedOrderIds = new Set(tripData.allocations.map((row) => row.order_id));
  const availableOrders = orders.filter((order) => !allocatedOrderIds.has(order.order_id));
  const allocationsByTrip = new Map<string, typeof tripData.allocations>();
  for (const row of tripData.allocations) allocationsByTrip.set(row.trip_id, [...(allocationsByTrip.get(row.trip_id) ?? []), row]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Finance · Logistics" title="تكلفة رحلات المعلمين → الهضبة" description="كل رحلة لها Actual Cost مستقل. النظام يوزّعها تلقائيًا على الطلبات اللي طلعت في الرحلة علشان Unit Economics يفضل دقيق." icon={<Route size={16} />} actions={<form method="get" className="flex gap-2"><input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض</button></form>} />

      <section className="grid gap-4 xl:grid-cols-[.9fr_1.4fr]">
        <Card title="تسجيل رحلة" description="الـ140 EGP Default فقط؛ غيّر الرقم لكل رحلة حسب اللي اتدفع فعليًا.">
          <form action={createTripAction} className="space-y-3">
            <input type="hidden" name="trip_date" value={date} />
            <div className="grid grid-cols-2 gap-3"><label className={financeLabel}>من<input name="origin" defaultValue="المعلمين" className={financeInput} /></label><label className={financeLabel}>إلى<input name="destination" defaultValue="الهضبة" className={financeInput} /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className={financeLabel}>Actual Trip Cost<input required min="0" step="0.01" name="total_cost" type="number" defaultValue="140" className={financeInput} /></label><label className={financeLabel}>Departure<input name="departure_time" type="time" className={financeInput} /></label></div>
            <label className={financeLabel}>Driver / Employee<select name="driver_employee_id" className={financeInput}><option value="">بدون تحديد</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select></label>
            <div>
              <p className={financeLabel}>Orders في الرحلة</p>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-[16px] border border-gray-100 bg-[#fcfcfd] p-2.5">
                {availableOrders.length ? availableOrders.map((order) => <label key={order.order_id} className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-2.5 text-xs"><span className="flex items-center gap-2"><input type="checkbox" name="order_id" value={order.order_id} className="h-4 w-4" /><span className="font-semibold text-gray-900">{order.order_code}</span></span><span className="text-gray-500">{order.store_name} · {money(order.total_amount)}</span></label>) : <p className="p-3 text-xs font-medium text-gray-400">كل Orders اليوم موزعة بالفعل أو لا توجد طلبات.</p>}
              </div>
            </div>
            <label className={financeLabel}>Notes<textarea name="notes" className={financeTextarea} /></label>
            <button className={primaryButton} disabled={!availableOrders.length}><Truck size={14} /> إنشاء وتوزيع الرحلة</button>
          </form>
        </Card>

        <Card title="رحلات اليوم" description="Equal allocation هو الـdefault، مع remainder على آخر Order لضمان تطابق إجمالي الرحلة 100%.">
          <div className="space-y-3">
            {tripData.trips.length ? tripData.trips.map((trip) => {
              const allocations = allocationsByTrip.get(trip.id) ?? [];
              const allocationTotal = allocations.reduce((sum, row) => sum + Number(row.allocated_cost ?? 0), 0);
              return <div key={trip.id} className="rounded-[20px] border border-gray-100 bg-[#fcfcfd] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><p className="font-semibold text-gray-950">{trip.trip_code}</p><StatusPill tone={trip.status === 'completed' ? 'success' : 'neutral'}>{trip.status}</StatusPill></div><p className="mt-1 text-[11px] font-medium text-gray-500">{trip.origin} → {trip.destination} {trip.departure_time ? `· ${trip.departure_time}` : ''}</p></div><div className="text-left"><p className="text-lg font-semibold">{money(trip.total_cost)}</p><p className="text-[10px] font-medium text-gray-400">{allocations.length} orders · {allocations.length ? money(Number(trip.total_cost) / allocations.length) : money(0)} avg/order</p></div></div><div className="mt-3 flex flex-wrap gap-2">{allocations.map((row) => <span key={row.order_id} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600">{orders.find((order) => order.order_id === row.order_id)?.order_code ?? row.order_id.slice(0, 8)} · {money(row.allocated_cost)}</span>)}</div>{Math.abs(allocationTotal - Number(trip.total_cost)) > 0.009 ? <p className="mt-3 text-[11px] font-semibold text-rose-700">Allocation difference: {money(Number(trip.total_cost) - allocationTotal)}</p> : null}</div>;
            }) : <div className="flex min-h-48 items-center justify-center text-sm font-medium text-gray-400">لا توجد رحلات مسجلة لهذا اليوم.</div>}
          </div>
        </Card>
      </section>
    </div>
  );
}
