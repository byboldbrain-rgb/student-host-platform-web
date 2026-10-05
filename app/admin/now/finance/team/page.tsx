import { CalendarCheck, UserPlus, UsersRound } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { addAttendanceAction, createEmployeeAction, setEmployeeActiveAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton, secondaryButton } from '../components/finance-ui';
import { getAttendance, normalizeDate } from '../lib/finance-data';

const roles: Record<string, string> = {
  pickup_rider: 'Pickup Rider',
  maallemeen_hub: 'موظف موقف المعلمين',
  hadaba_delivery: 'تسليم الهضبة',
  operations: 'Operations',
  customer_success: 'Customer Success',
  finance: 'Finance',
  other: 'Other',
};

export default async function TeamFinancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const data = await getAttendance(date);
  const attendanceByEmployee = new Map(data.attendance.map((row) => [row.employee_id, row]));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Finance · People" title="الموظفين والحضور" description="Payroll يبدأ من هنا: Role + Pay Basis + Rate، وبعدها الحضور الفعلي وساعات العمل والـBonuses/Deductions." icon={<UsersRound size={16} />} actions={<form method="get" className="flex gap-2"><input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض الحضور</button></form>} />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card title="إضافة موظف" description="يدعم Monthly / Daily / Hourly / Per Order / Per Trip.">
          <form action={createEmployeeAction} className="grid gap-3 md:grid-cols-2">
            <label className={financeLabel}>الاسم<input required name="full_name" className={financeInput} /></label>
            <label className={financeLabel}>Employee Code<input name="employee_code" className={financeInput} placeholder="اختياري" /></label>
            <label className={financeLabel}>الموبايل<input name="phone" className={financeInput} /></label>
            <label className={financeLabel}>Role<select name="role" className={financeInput}>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className={financeLabel}>Employment<select name="employment_type" className={financeInput}><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contractor">Contractor</option><option value="temporary">Temporary</option></select></label>
            <label className={financeLabel}>Pay Basis<select name="pay_basis" className={financeInput}><option value="monthly">Monthly</option><option value="daily">Daily</option><option value="hourly">Hourly</option><option value="per_order">Per Order</option><option value="per_trip">Per Trip</option></select></label>
            <label className={financeLabel}>Base Rate (EGP)<input min="0" step="0.01" name="base_rate" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Overtime Rate / Hour<input min="0" step="0.01" name="overtime_rate" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Incentive / Order<input min="0" step="0.01" name="incentive_per_order" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Incentive / Trip<input min="0" step="0.01" name="incentive_per_trip" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Start Date<input name="start_date" type="date" defaultValue={date} className={financeInput} /></label>
            <label className={financeLabel}>Notes<input name="notes" className={financeInput} /></label>
            <button className={`${primaryButton} md:col-span-2`}><UserPlus size={14} /> إضافة الموظف</button>
          </form>
        </Card>

        <Card title="تسجيل حضور" description={`الحضور المعتمد بتاريخ ${date}. Overtime يتحسب تلقائيًا Actual - Scheduled.`}>
          {data.employees.length ? <form action={addAttendanceAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="work_date" value={date} />
            <label className={`${financeLabel} md:col-span-2`}>الموظف<select required name="employee_id" className={financeInput}><option value="">اختر الموظف</option>{data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name} — {roles[employee.role] ?? employee.role}</option>)}</select></label>
            <label className={financeLabel}>Shift<input name="shift_label" className={financeInput} placeholder="12:00 - 18:00" /></label>
            <label className={financeLabel}>Scheduled Hours<input min="0" step="0.25" name="scheduled_hours" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Actual Hours<input min="0" step="0.25" name="actual_hours" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Orders Handled<input min="0" name="orders_handled" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Trips Handled<input min="0" name="trips_handled" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Bonus<input min="0" step="0.01" name="bonus" type="number" className={financeInput} /></label>
            <label className={financeLabel}>Deduction<input min="0" step="0.01" name="deduction" type="number" className={financeInput} /></label>
            <label className={`${financeLabel} md:col-span-2`}>Notes<textarea name="notes" className={financeTextarea} /></label>
            <button className={`${primaryButton} md:col-span-2`}><CalendarCheck size={14} /> تسجيل الحضور</button>
          </form> : <p className="text-sm font-medium text-gray-500">أضف الموظفين أولًا.</p>}
        </Card>
      </section>

      <Card title="Team Roster" description="الموظفين الحاليين وتأثير رواتبهم على Finance OS.">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Employee</th><th className="p-3">Role</th><th className="p-3">Pay Basis</th><th className="p-3">Rate</th><th className="p-3">Today Hours</th><th className="p-3">Orders</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead><tbody>{data.employees.map((employee) => {
          const attendance = attendanceByEmployee.get(employee.id);
          return <tr key={employee.id} className="border-b border-gray-50"><td className="p-3"><p className="font-semibold text-gray-950">{employee.full_name}</p><p className="mt-1 text-[10px] text-gray-400">{employee.phone ?? employee.employee_code ?? '—'}</p></td><td className="p-3">{roles[employee.role] ?? employee.role}</td><td className="p-3">{employee.pay_basis}</td><td className="p-3 font-semibold">{money(employee.base_rate)}</td><td className="p-3">{attendance?.actual_hours ?? '—'}</td><td className="p-3">{attendance?.orders_handled ?? '—'}</td><td className="p-3"><StatusPill tone={employee.is_active ? 'success' : 'neutral'}>{employee.is_active ? 'Active' : 'Inactive'}</StatusPill></td><td className="p-3"><form action={setEmployeeActiveAction}><input type="hidden" name="employee_id" value={employee.id} /><input type="hidden" name="is_active" value={employee.is_active ? 'false' : 'true'} /><button className={secondaryButton}>{employee.is_active ? 'إيقاف' : 'تفعيل'}</button></form></td></tr>;
        })}</tbody></table></div>
      </Card>
    </div>
  );
}
