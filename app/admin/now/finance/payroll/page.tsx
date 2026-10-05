import { Banknote, Calculator } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { markPayrollPaidAction } from '../actions';
import { Card, StatusPill, financeInput, money, primaryButton, secondaryButton } from '../components/finance-ui';
import { getPayroll, monthStart } from '../lib/finance-data';
import { generatePayrollAction } from '../payroll-actions';

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = monthStart(params.month);
  const data = await getPayroll(month);
  const employeeById = new Map(data.employees.map((employee) => [employee.id, employee]));
  const totalNet = data.payroll.reduce((sum, row) => sum + Number(row.net_pay ?? 0), 0);
  const totalPaid = data.payroll.reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0);

  return <div className="space-y-5">
    <PageHeader eyebrow="Finance · Payroll" title="الرواتب" description="Payroll مبني على Pay Basis + Attendance + Overtime + Incentives + Bonuses/Deductions. تقدر تعيد Generate في أي وقت قبل الاعتماد النهائي." icon={<Banknote size={16} />} actions={<form method="get" className="flex gap-2"><input type="month" name="month" defaultValue={month.slice(0,7)} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض</button></form>} />

    <section className="grid gap-3 sm:grid-cols-3"><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Net Payroll</p><p className="mt-2 text-2xl font-semibold">{money(totalNet)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Paid</p><p className="mt-2 text-2xl font-semibold text-emerald-700">{money(totalPaid)}</p></div><div className="rounded-[22px] border border-gray-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase text-gray-400">Outstanding</p><p className="mt-2 text-2xl font-semibold text-amber-700">{money(totalNet-totalPaid)}</p></div></section>

    <Card title="Payroll Run" description="Generate يحسب الرواتب من سجلات الموظفين والحضور؛ الدفعات السابقة لا تضيع عند إعادة الحساب." action={<form action={generatePayrollAction}><input type="hidden" name="payroll_month" value={month.slice(0,7)} /><button className={primaryButton}><Calculator size={14} /> Generate Payroll</button></form>}>
      {data.payroll.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Employee</th><th className="p-3">Base</th><th className="p-3">OT</th><th className="p-3">Incentives</th><th className="p-3">Allowances</th><th className="p-3">Deductions</th><th className="p-3">Net</th><th className="p-3">Paid</th><th className="p-3">Status</th><th className="p-3">Payment</th></tr></thead><tbody>{data.payroll.map((row) => {
        const employee = employeeById.get(row.employee_id);
        return <tr key={row.id} className="border-b border-gray-50 align-top"><td className="p-3"><p className="font-semibold text-gray-950">{employee?.full_name ?? '—'}</p><p className="mt-1 text-[10px] text-gray-400">{employee?.role} · {employee?.pay_basis}</p></td><td className="p-3">{money(row.base_pay)}</td><td className="p-3">{money(row.overtime_pay)}</td><td className="p-3">{money(row.incentives)}</td><td className="p-3">{money(row.allowances)}</td><td className="p-3">{money(row.deductions)}</td><td className="p-3 font-semibold">{money(row.net_pay)}</td><td className="p-3">{money(row.paid_amount)}</td><td className="p-3"><StatusPill tone={row.status === 'paid' ? 'success' : row.status === 'partial' ? 'warning' : 'neutral'}>{row.status}</StatusPill></td><td className="p-3"><form action={markPayrollPaidAction} className="flex min-w-[280px] gap-2"><input type="hidden" name="payroll_id" value={row.id} /><input name="paid_amount" type="number" min="0" step="0.01" defaultValue={row.paid_amount ?? 0} className={financeInput.replace('mt-1.5 ', '')} /><select name="payment_method" defaultValue={row.payment_method ?? 'InstaPay'} className={financeInput.replace('mt-1.5 ', '')}><option>InstaPay</option><option>Cash</option><option>Vodafone Cash</option><option>Bank Transfer</option></select><button className={secondaryButton}>حفظ</button></form></td></tr>;
      })}</tbody></table></div> : <div className="flex min-h-44 flex-col items-center justify-center text-center"><p className="text-sm font-semibold text-gray-700">Payroll لم يتم توليده للشهر ده.</p><p className="mt-1 text-xs text-gray-400">سجل الحضور ثم اضغط Generate Payroll.</p></div>}
    </Card>
  </div>;
}
