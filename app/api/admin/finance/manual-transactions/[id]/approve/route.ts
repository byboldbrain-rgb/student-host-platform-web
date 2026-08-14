import { NextRequest, NextResponse } from 'next/server'

import {
  canApproveFinanceTransactions,
  getFinanceAdminContext,
} from '@/src/lib/finance/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, routeContext: RouteContext) {
  try {
    const context = await getFinanceAdminContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canApproveFinanceTransactions(context.admin.role)) {
      return NextResponse.json(
        { error: 'Only an accountant or administrator can approve this transaction.' },
        { status: 403 },
      )
    }

    const { id } = await routeContext.params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 })
    }

    const { data, error } = await context.adminClient.rpc(
      'finance_approve_manual_transaction',
      {
        p_transaction_id: id,
        p_approved_by_admin_id: context.admin.id,
      },
    )

    if (error) {
      return NextResponse.json(
        { error: `Approval failed: ${error.message}` },
        { status: 400 },
      )
    }

    return NextResponse.json({ result: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
