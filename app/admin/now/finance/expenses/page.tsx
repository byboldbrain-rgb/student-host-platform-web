import { ReceiptText } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { addExpenseAction } from '../expense-actions';
import { Card, StatusPill, financeInput, financeLabel, financeTextarea, money, primaryButton } from '../components/finance-ui';
import { getCashLedger } from '../lib/cash-data';
import { getEmployees, getExpenses, getFinanceSummary, normalizeDate } from '../lib/finance-data';

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = normalizeDate(params.date);
  const [expenses, employees, cash, summary] = await Promise.all([
    getExpenses(date),
    getEmployees(false),
    getCashLedger(),
    getFinanceSummary(date),
  ]);

  const movementByAccount = new Map<string, number>();
  for (const transaction of cash.transactions) {
    const signed = Number(transaction.amount ?? 0) * (transaction.direction === 'in' ? 1 : -1);
    movementByAccount.set(transaction.account_id, (movementByAccount.get(transaction.account_id) ?? 0) + signed);
  }

  const activeAccounts = cash.accounts
    .filter((account) => account.is_active)
    .map((account) => ({
      ...account,
      bookBalance: Number(account.opening_balance ?? 0) + (movementByAccount.get(account.id) ?? 0),
    }));
  const accountById = new Map(cash.accounts.map((account) => [account.id, account]));
  const otherOperatingExpenses = Math.max(0, Number(summary.operating_expenses ?? 0) - Number(summary.payroll_cost ?? 0));

  return <div className="space-y-5">
    <PageHeader
      eyebrow="Finance · OpEx"
      title="المصروفات التشغيلية"
      description="الرواتب جزء من Operating Expenses تلقائيًا. هنا بنسجل باقي المصروفات، وكل مصروف مدفوع بيتربط بحساب Treasury ويتخصم فورًا من الـBook Balance."
      icon={<ReceiptText size={16} />}
      actions={<form method="get" className="flex gap-2"><input name="date" type="date" defaultValue={date} className={financeInput.replace('mt-1.5 ', '')} /><button className={primaryButton}>عرض</button></form>}
    />

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-[22px] border border-slate-100 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Operating Expenses</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{money(summary.operating_expenses)}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500">Payroll + other OpEx</p>
      </div>
      <div className="rounded-[22px] border border-slate-100 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Payroll</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{money(summary.payroll_cost)}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500">People cost accrued for the day</p>
      </div>
      <div className="rounded-[22px] border border-slate-100 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Other OpEx</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{money(otherOperatingExpenses)}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500">Approved non-payroll expenses</p>
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[.8fr_1.4fr]">
      <Card title="إضافة مصروف" description="اختار الحساب اللي اتدفعت منه الفلوس؛ النظام هيعمل Cash Out ويربطه بالمصروف تلقائيًا.">
        {activeAccounts.length ? (
          <form action={addExpenseAction} className="space-y-3">
            <input type="hidden" name="expense_date" value={date} />
            <label className={financeLabel}>الوصف<input required name="description" className={financeInput} placeholder="مثال: أكياس تغليف" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={financeLabel}>المبلغ<input required min="0.01" step="0.01" name="amount" type="number" className={financeInput} /></label>
              <label className={financeLabel}>Category<select name="category" className={financeInput}><option value="packaging">Packaging</option><option value="marketing">Marketing</option><option value="software">Software</option><option value="rent_utilities">Rent & Utilities</option><option value="customer_recovery">Customer Recovery</option><option value="admin">Admin</option><option value="other">Other</option></select></label>
            </div>
            <label className={financeLabel}>Cost Center<select name="cost_center" className={financeInput}><option value="operations">Operations</option><option value="delivery">Delivery</option><option value="customer_success">Customer Success</option><option value="marketing">Growth / Marketing</option><option value="technology">Technology</option><option value="admin">Admin / G&A</option><option value="finance">Finance</option></select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className={financeLabel}>Vendor<input name="vendor" className={financeInput} /></label>
              <label className={financeLabel}>Payment Account<select required name="payment_account_id" className={financeInput}><option value="">اختار الحساب</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.account_name} · {money(account.bookBalance)}</option>)}</select></label>
            </div>
            <p className="rounded-[12px] bg-slate-50 px-3 py-2 text-[10px] font-medium leading-5 text-slate-500">الرصيد الظاهر هو Book Balance. تسجيل المصروف ينشئ Cash Out تلقائيًا، بينما Actual Balance يفضل للمطابقة اليدوية فقط.</p>
            <label className={financeLabel}>Related Employee<select name="related_employee_id" className={financeInput}><option value="">—</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select></label>
            <label className={financeLabel}>Receipt URL<input name="receipt_url" type="url" className={financeInput} /></label>
            <label className={financeLabel}>Notes<textarea name="notes" className={financeTextarea} /></label>
            <button className={primaryButton}>تسجيل المصروف وخصمه من الحساب</button>
          </form>
        ) : (
          <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-6 text-amber-900">لا يوجد Cash Account فعال. أضف حساب من صفحة الكاش والمحافظ قبل تسجيل مصروف مدفوع.</div>
        )}
      </Card>

      <Card title="مصروفات اليوم" description="كل مصروف Approved هنا له Payment Account وCash Transaction مرتبطة به.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-xs">
            <thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Cost Center</th><th className="p-3">Vendor</th><th className="p-3">Payment Account</th><th className="p-3">Amount</th><th className="p-3">Cash Link</th></tr></thead>
            <tbody>{expenses.map((row) => <tr key={row.id} className="border-b border-gray-50"><td className="p-3 font-semibold text-gray-900">{row.description}</td><td className="p-3">{row.category}</td><td className="p-3">{row.cost_center}</td><td className="p-3">{row.vendor ?? '—'}</td><td className="p-3 font-semibold text-slate-700">{row.payment_account_id ? accountById.get(row.payment_account_id)?.account_name ?? 'Unknown account' : '—'}</td><td className="p-3 font-semibold">{money(row.amount)}</td><td className="p-3"><StatusPill tone={row.cash_transaction_id ? 'success' : 'warning'}>{row.cash_transaction_id ? 'Linked' : 'Missing'}</StatusPill></td></tr>)}</tbody>
          </table>
          {!expenses.length ? <div className="flex min-h-40 items-center justify-center text-sm text-gray-400">لا توجد مصروفات مسجلة.</div> : null}
        </div>
      </Card>
    </section>
  </div>;
}
