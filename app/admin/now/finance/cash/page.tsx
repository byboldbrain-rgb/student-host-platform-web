import { Wallet } from 'lucide-react';

import { PageHeader } from '../../components/ui-kit';
import { addCashAccountAction, addCashTransactionAction } from '../actions';
import { Card, StatusPill, financeInput, financeLabel, money, primaryButton } from '../components/finance-ui';
import { getCashLedger } from '../lib/cash-data';

export default async function CashPage() {
  const data = await getCashLedger();
  const accountById = new Map(data.accounts.map((account) => [account.id, account]));
  const movementByAccount = new Map<string, number>();
  for (const txn of data.transactions) {
    const signed = Number(txn.amount ?? 0) * (txn.direction === 'in' ? 1 : -1);
    movementByAccount.set(txn.account_id, (movementByAccount.get(txn.account_id) ?? 0) + signed);
  }
  const recentTransactions = data.transactions.slice(0, 150);

  return <div className="space-y-5">
    <PageHeader eyebrow="Finance · Treasury" title="الكاش والمحافظ" description="Profit مش هو Cash. هنا بنتابع رصيد الكاش، InstaPay والمحافظ والحركة الفعلية، ونقارن Book Balance بالرصيد الحقيقي." icon={<Wallet size={16} />} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.accounts.map((account) => {
        const book = Number(account.opening_balance ?? 0) + (movementByAccount.get(account.id) ?? 0);
        const actual = account.actual_balance === null ? null : Number(account.actual_balance);
        const difference = actual === null ? null : actual - book;
        return <div key={account.id} className="rounded-[22px] border border-gray-100 bg-white p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase text-gray-400">{account.account_type}</p><p className="mt-1 font-semibold text-gray-950">{account.account_name}</p></div><StatusPill tone={difference === null ? 'neutral' : Math.abs(difference) < .01 ? 'success' : 'danger'}>{difference === null ? 'Not reconciled' : Math.abs(difference) < .01 ? 'Matched' : 'Difference'}</StatusPill></div><p className="mt-4 text-2xl font-semibold">{money(book)}</p><p className="mt-1 text-[10px] font-medium text-gray-400">Book balance · full ledger</p>{actual !== null ? <p className={`mt-2 text-xs font-semibold ${Math.abs(difference ?? 0) < .01 ? 'text-emerald-700' : 'text-rose-700'}`}>Actual {money(actual)} · Diff {money(difference)}</p> : null}</div>;
      })}
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <Card title="إضافة Cash Account" description="مثال: Cash Drawer، InstaPay، Vodafone Cash.">
        <form action={addCashAccountAction} className="grid gap-3 md:grid-cols-2"><label className={`${financeLabel} md:col-span-2`}>اسم الحساب<input required name="account_name" className={financeInput} /></label><label className={financeLabel}>Type<select name="account_type" className={financeInput}><option value="cash">Cash</option><option value="wallet">Wallet</option><option value="bank">Bank</option><option value="other">Other</option></select></label><label className={financeLabel}>Opening Balance<input name="opening_balance" type="number" step="0.01" defaultValue="0" className={financeInput} /></label><label className={financeLabel}>Actual Balance<input name="actual_balance" type="number" step="0.01" className={financeInput} placeholder="للمطابقة" /></label><label className={financeLabel}>Notes<input name="notes" className={financeInput} /></label><button className={`${primaryButton} md:col-span-2`}>إضافة الحساب</button></form>
      </Card>

      <Card title="Cash Transaction" description="سجّل الحركة الفعلية داخل/خارج حسابات Navienty.">
        {data.accounts.length ? <form action={addCashTransactionAction} className="grid gap-3 md:grid-cols-2"><label className={`${financeLabel} md:col-span-2`}>Account<select required name="account_id" className={financeInput}><option value="">اختر</option>{data.accounts.filter((account) => account.is_active).map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}</select></label><label className={financeLabel}>Direction<select name="direction" className={financeInput}><option value="in">In</option><option value="out">Out</option></select></label><label className={financeLabel}>Amount<input required min="0.01" step="0.01" name="amount" type="number" className={financeInput} /></label><label className={financeLabel}>Category<select name="category" className={financeInput}><option value="customer_collection">Customer Collection</option><option value="rider_advance">Rider Advance</option><option value="payroll">Payroll</option><option value="expense">Expense</option><option value="store_payment">Store Payment</option><option value="transfer">Transfer</option><option value="other">Other</option></select></label><label className={financeLabel}>Counterparty<input name="counterparty" className={financeInput} /></label><label className={`${financeLabel} md:col-span-2`}>Description<input name="description" className={financeInput} /></label><button className={`${primaryButton} md:col-span-2`}>تسجيل الحركة</button></form> : <p className="text-sm font-medium text-gray-500">أضف Cash Account أولًا.</p>}
      </Card>
    </section>

    <Card title="آخر الحركات" description="Book Balance يتحسب من كل الـledger؛ الجدول يعرض آخر 150 حركة فقط للحفاظ على سرعة الصفحة.">
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-right text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400"><th className="p-3">Account</th><th className="p-3">Direction</th><th className="p-3">Category</th><th className="p-3">Counterparty</th><th className="p-3">Amount</th><th className="p-3">Reconciled</th></tr></thead><tbody>{recentTransactions.map((txn) => <tr key={txn.id} className="border-b border-gray-50"><td className="p-3 font-semibold">{accountById.get(txn.account_id)?.account_name ?? '—'}</td><td className={`p-3 font-semibold ${txn.direction === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>{txn.direction.toUpperCase()}</td><td className="p-3">{txn.category}</td><td className="p-3">{txn.counterparty ?? '—'}</td><td className="p-3 font-semibold">{money(txn.amount)}</td><td className="p-3"><StatusPill tone={txn.reconciled ? 'success' : 'neutral'}>{txn.reconciled ? 'Yes' : 'No'}</StatusPill></td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}
