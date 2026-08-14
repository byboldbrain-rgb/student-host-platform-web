import { NextResponse } from 'next/server'

import {
  canApproveFinanceTransactions,
  canPostFinanceTransactions,
  getFinanceAdminContext,
} from '@/src/lib/finance/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const context = await getFinanceAdminContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [accountsResult, bankAccountsResult, propertiesResult, reservationsResult] =
      await Promise.all([
        context.adminClient
          .from('finance_accounts')
          .select(
            'id, code, name_ar, name_en, account_type, normal_balance, system_key, allow_manual_posting',
          )
          .eq('is_active', true)
          .eq('allow_manual_posting', true)
          .order('code', { ascending: true }),
        context.adminClient
          .from('finance_bank_accounts')
          .select(
            'id, name_ar, name_en, account_type, linked_finance_account_id, provider_name, currency, is_active',
          )
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        context.adminClient
          .from('properties')
          .select('id, property_id, title_ar, title_en, owner_id, broker_id')
          .order('updated_at', { ascending: false })
          .limit(500),
        context.adminClient
          .from('property_reservations')
          .select(
            'id, property_id, customer_name, total_price_egp, payment_status, status, created_at, season_name_ar, season_name_en, user_id',
          )
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(500),
      ])

    const errors = [
      accountsResult.error,
      bankAccountsResult.error,
      propertiesResult.error,
      reservationsResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: errors.map((item) => item?.message).filter(Boolean).join(' | '),
        },
        { status: 500 },
      )
    }

    const accountCodeById = new Map(
      (accountsResult.data || []).map((account) => [account.id, account.code]),
    )

    const financeBankAccounts = (bankAccountsResult.data || []).map((account) => ({
      ...account,
      finance_account_code:
        accountCodeById.get(account.linked_finance_account_id) || null,
    }))

    return NextResponse.json({
      accounts: accountsResult.data || [],
      bankAccounts: financeBankAccounts,
      properties: propertiesResult.data || [],
      reservations: reservationsResult.data || [],
      admin: {
        id: context.admin.id,
        fullName: context.admin.full_name,
        role: context.admin.role,
        canPost: canPostFinanceTransactions(context.admin.role),
        canApprove: canApproveFinanceTransactions(context.admin.role),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
