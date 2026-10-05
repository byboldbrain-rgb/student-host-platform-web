import { ReceiptText } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { addExpenseAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton } from '../components/finance-ui';
import { getEmployees, getExpenses, normalizeDate } from '../lib/finance-data';

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const [expenses, employees] = await Promise.all([getExpenses(date), getEmployees(false)]);
  const total = expenses.filter((row) => row.status === 'approved').reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  return <div className="space-y-5">
    <PageHeader eyebrow="Finance · OpEx" title="المصروفات التشغيلية" description="سجل المصروفات اللي مش داخلة بالفعل في Product Cost أو Trip Cost أو Payroll علشان نتجنب Double Counting." icon={<ReceiptText size={16} />} actions={<form method="get" className="flex gap-2"><input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض</button></form>} />
    <section className="grid gap-4 xl:grid-cols-[.8fr_1.4fr]">
      <Card title="إضافة مصروف" description={`Approved OpEx اليوم: ${money(total)}`}>
        <form action={addExpenseAction} className="space-y-3"><input type="hidden" name="expense_date" value={date} />
          <label className={financeLabel}>الوصف<input required name="description" className={financeInput} placeholder="مثال: أكياس تغليف" /></label>
          <div className="grid grid-cols-2 gap-3"><label className={financeLabel}>المبلغ<input required min="0.01" step="0.01" name="amount" type="number" className={financeInput} /></label><label className={financeLabel}>Category<select name="category" className={financeInput}><option value="packaging">Packaging</option><option value="marketing">Marketing</option><option value="software">Software</option><option value="rent_utilities">Rent & Utilities</option><option value="customer_recovery">Customer Recovery</option><option value="admin">Admin</option><option value="other">Other</option></select></label></div>
          <label className={financeLabel}>Cost Center<select name="cost_center" className={financeInput}><option value="operations">Operations</option><option value="delivery">Delivery</option><option value="customer_success">Customer Success</option><option value="marketing">Growth / Marketing</option><option value="technology">Technology</option><option value="admin">Admin / G&A</option><option value="finance">Finance</option></select></label>
          <div className="grid grid-cols-2 gap-3"><label className={financeLabel}>Vendor<input name="vendor" className={financeInput} /></label><label className={financeLabel}>Payment<select name="payment_method" className={financeInput}><option>Cash</option><option>InstaPay</option><option>Vodafone Cash</option><option>Bank Transfer</option><option>Other</option></select></label></div>
          <label className={financeLabel}>Related Employee<select name="related_employee_id" className={financeInput}><option value="">—</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select></label>
          <label className={financeLabel}>Receipt URL<input name="receipt_url" type="url" className={financeInput} /></label>
          <label className={financeLabel}>Notes<textarea name="notes" className={financeTextarea} /></label>
          <button className={primaryButton}>تسجيل المصروف</button>
        </form>
      </Card>
      <Card title="مصروفات اليوم" description="المصروف Approved يدخل مباشرة في Daily Operating Profit.">
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Cost Center</th><th className="p-3">Vendor</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead><tbody>{expenses.map((row) => <tr key={row.id} className="border-b border-gray-50"><td className="p-3 font-semibold text-gray-900">{row.description}</td><td className="p-3">{row.category}</td><td className="p-3">{row.cost_center}</td><td className="p-3">{row.vendor ?? '—'}</td><td className="p-3 font-semibold">{money(row.amount)}</td><td className="p-3"><StatusPill tone={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}>{row.status}</StatusPill></td></tr>)}</tbody></table>{!expenses.length ? <div className="flex min-h-40 items-center justify-center text-sm text-gray-400">لا توجد مصروفات مسجلة.</div> : null}</div>
      </Card>
    </section>
  </div>;
}
