import { redirect } from 'next/navigation'

import ManualTransactionsClient from '@/app/admin/finance/manual-transactions/ManualTransactionsClient'
import { getFinanceAdminContext } from '@/src/lib/finance/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manual Finance Transactions | Navienty',
  description: 'Record and approve manual Navienty finance transactions.',
}

export default async function ManualFinanceTransactionsPage() {
  const context = await getFinanceAdminContext()

  if (!context) {
    redirect('/admin/unauthorized')
  }

  return <ManualTransactionsClient />
}
