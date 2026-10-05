import 'server-only';

import { requireFinanceAdmin } from './finance-data';

export async function getCashLedger() {
  const { admin } = await requireFinanceAdmin();
  const [{ data: accounts, error: accountError }, { data: transactions, error: transactionError }] = await Promise.all([
    admin.schema('now').from('finance_cash_accounts').select('*').order('is_active', { ascending: false }).order('account_name'),
    admin.schema('now').from('finance_cash_transactions').select('*').order('transaction_at', { ascending: false }),
  ]);

  if (accountError) throw new Error(accountError.message);
  if (transactionError) throw new Error(transactionError.message);

  return {
    accounts: accounts ?? [],
    transactions: transactions ?? [],
  };
}
