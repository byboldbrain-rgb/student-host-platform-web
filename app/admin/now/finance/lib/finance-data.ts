import 'server-only';

import { redirect } from 'next/navigation';

import { createAdminClient } from '@/src/lib/supabase/admin';
import { requireNowAdmin } from '../../lib/admin-data';

export type FinanceSummary = {
  date: string;
  completed_orders: number;
  gmv: number;
  collections: number;
  delivery_revenue: number;
  payment_fee_revenue: number;
  discounts: number;
  actual_product_cost: number;
  trip_cost: number;
  other_variable_cost: number;
  contribution_profit: number;
  payroll_cost: number;
  operating_expenses: number;
  operating_profit: number;
  contribution_per_order: number;
  operating_profit_per_order: number;
  known_purchase_orders: number;
  missing_purchase_cost_orders: number;
  missing_trip_orders: number;
  breakeven_orders: number | null;
};

export type OrderEconomics = {
  order_id: string;
  order_code: string;
  store_name: string;
  delivered_at: string | null;
  subtotal: number;
  delivery_fee: number;
  payment_fee: number;
  discounts: number;
  total_amount: number;
  actual_product_cost: number;
  trip_cost: number;
  other_variable_cost: number;
  contribution_profit: number;
  cost_complete: boolean;
};

export type FinanceEmployee = {
  id: string;
  employee_code: string | null;
  full_name: string;
  phone: string | null;
  role: string;
  employment_type: string;
  pay_basis: string;
  base_rate: number;
  overtime_rate: number;
  incentive_per_order: number;
  incentive_per_trip: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
};

function numberify<T extends Record<string, unknown>>(row: T, keys: Array<keyof T>) {
  const copy = { ...row };
  for (const key of keys) {
    const value = copy[key];
    if (value !== null && value !== undefined) {
      copy[key] = Number(value) as T[keyof T];
    }
  }
  return copy;
}

export function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function normalizeDate(value?: string | null) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? (value as string) : cairoToday();
}

export function monthStart(value?: string | null) {
  const date = normalizeDate(value);
  return `${date.slice(0, 7)}-01`;
}

export async function requireFinanceAdmin() {
  const { access } = await requireNowAdmin();
  if (!access.permissions.manage_finance) redirect('/admin/unauthorized');
  return { access, admin: createAdminClient() };
}

export async function getFinanceSummary(date = cairoToday()) {
  const { admin } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').rpc('finance_dashboard_summary', {
    p_date: normalizeDate(date),
  });
  if (error) throw new Error(error.message);
  return numberify((data ?? {}) as FinanceSummary, [
    'completed_orders', 'gmv', 'collections', 'delivery_revenue', 'payment_fee_revenue',
    'discounts', 'actual_product_cost', 'trip_cost', 'other_variable_cost',
    'contribution_profit', 'payroll_cost', 'operating_expenses', 'operating_profit',
    'contribution_per_order', 'operating_profit_per_order', 'known_purchase_orders',
    'missing_purchase_cost_orders', 'missing_trip_orders', 'breakeven_orders',
  ] as Array<keyof FinanceSummary>);
}

export async function getFinanceDashboard(date = cairoToday()) {
  const normalized = normalizeDate(date);
  const { admin } = await requireFinanceAdmin();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(`${normalized}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (6 - index));
    return d.toISOString().slice(0, 10);
  });

  const [summary, economicsResult, employeesResult, advancesResult, expensesResult, closesResult, trend] = await Promise.all([
    getFinanceSummary(normalized),
    admin.schema('now').rpc('list_finance_order_economics', { p_date: normalized, p_limit: 8 }),
    admin.schema('now').from('finance_employees').select('id,role,is_active', { count: 'exact' }).eq('is_active', true),
    admin.schema('now').from('finance_rider_advances').select('amount,settled').eq('settled', false),
    admin.schema('now').from('finance_expenses').select('amount,status').eq('expense_date', normalized).eq('status', 'approved'),
    admin.schema('now').from('finance_daily_closes').select('close_date,status,closed_at').eq('close_date', normalized).maybeSingle(),
    Promise.all(dates.map(async (day) => {
      const { data } = await admin.schema('now').rpc('finance_dashboard_summary', { p_date: day });
      const parsed = numberify((data ?? {}) as FinanceSummary, ['completed_orders', 'collections', 'operating_profit'] as Array<keyof FinanceSummary>);
      return { date: day, orders: parsed.completed_orders ?? 0, collections: parsed.collections ?? 0, operatingProfit: parsed.operating_profit ?? 0 };
    })),
  ]);

  if (economicsResult.error) throw new Error(economicsResult.error.message);
  if (employeesResult.error) throw new Error(employeesResult.error.message);

  const economics = ((economicsResult.data ?? []) as OrderEconomics[]).map((row) =>
    numberify(row, ['subtotal', 'delivery_fee', 'payment_fee', 'discounts', 'total_amount', 'actual_product_cost', 'trip_cost', 'other_variable_cost', 'contribution_profit']),
  );

  return {
    summary,
    economics,
    activeEmployees: employeesResult.count ?? employeesResult.data?.length ?? 0,
    openRiderCash: (advancesResult.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    approvedExpenses: (expensesResult.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    close: closesResult.data,
    trend,
  };
}

export async function getOrderEconomics(date = cairoToday(), limit = 100) {
  const { admin } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').rpc('list_finance_order_economics', {
    p_date: normalizeDate(date),
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as OrderEconomics[]).map((row) =>
    numberify(row, ['subtotal', 'delivery_fee', 'payment_fee', 'discounts', 'total_amount', 'actual_product_cost', 'trip_cost', 'other_variable_cost', 'contribution_profit']),
  );
}

export async function getEmployees(includeInactive = true) {
  const { admin } = await requireFinanceAdmin();
  let query = admin.schema('now').from('finance_employees').select('*').order('is_active', { ascending: false }).order('full_name');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as FinanceEmployee[]).map((row) => numberify(row, ['base_rate', 'overtime_rate', 'incentive_per_order', 'incentive_per_trip']));
}

export async function getRiderFinance(date = cairoToday()) {
  const normalized = normalizeDate(date);
  const { admin } = await requireFinanceAdmin();
  const riders = (await getEmployees(false)).filter((employee) => employee.role === 'pickup_rider');
  const riderIds = riders.map((rider) => rider.id);
  if (!riderIds.length) return { riders, advances: [], costs: [], settlements: [] };

  const [{ data: advances, error: advancesError }, { data: costs, error: costsError }, { data: settlements, error: settlementsError }] = await Promise.all([
    admin.schema('now').from('finance_rider_advances').select('*').in('rider_employee_id', riderIds).order('sent_at', { ascending: false }).limit(200),
    admin.schema('now').from('finance_order_costs').select('order_id,rider_employee_id,purchased_at,actual_product_cost').in('rider_employee_id', riderIds).order('purchased_at', { ascending: false }).limit(300),
    admin.schema('now').from('finance_rider_settlements').select('*').eq('settlement_date', normalized).order('created_at', { ascending: false }),
  ]);
  if (advancesError) throw new Error(advancesError.message);
  if (costsError) throw new Error(costsError.message);
  if (settlementsError) throw new Error(settlementsError.message);
  return { riders, advances: advances ?? [], costs: costs ?? [], settlements: settlements ?? [] };
}

export async function getTrips(date = cairoToday()) {
  const normalized = normalizeDate(date);
  const { admin } = await requireFinanceAdmin();
  const { data: trips, error } = await admin.schema('now').from('finance_trips').select('*').eq('trip_date', normalized).order('departure_time', { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (trips ?? []).map((trip) => trip.id);
  const allocations = ids.length
    ? await admin.schema('now').from('finance_trip_orders').select('trip_id,order_id,allocated_cost').in('trip_id', ids)
    : { data: [], error: null };
  if (allocations.error) throw new Error(allocations.error.message);
  return { trips: trips ?? [], allocations: allocations.data ?? [] };
}

export async function getAttendance(date = cairoToday()) {
  const normalized = normalizeDate(date);
  const { admin } = await requireFinanceAdmin();
  const [employees, attendance] = await Promise.all([
    getEmployees(false),
    admin.schema('now').from('finance_attendance').select('*').eq('work_date', normalized).order('created_at'),
  ]);
  if (attendance.error) throw new Error(attendance.error.message);
  return { employees, attendance: attendance.data ?? [] };
}

export async function getPayroll(month = monthStart()) {
  const normalized = monthStart(month);
  const { admin } = await requireFinanceAdmin();
  const [employees, payroll] = await Promise.all([
    getEmployees(true),
    admin.schema('now').from('finance_payroll').select('*').eq('payroll_month', normalized).order('created_at'),
  ]);
  if (payroll.error) throw new Error(payroll.error.message);
  return { employees, payroll: payroll.data ?? [], month: normalized };
}

export async function getExpenses(date = cairoToday()) {
  const normalized = normalizeDate(date);
  const { admin } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').from('finance_expenses').select('*').eq('expense_date', normalized).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCash() {
  const { admin } = await requireFinanceAdmin();
  const [{ data: accounts, error: accountError }, { data: transactions, error: transactionError }] = await Promise.all([
    admin.schema('now').from('finance_cash_accounts').select('*').order('is_active', { ascending: false }).order('account_name'),
    admin.schema('now').from('finance_cash_transactions').select('*').order('transaction_at', { ascending: false }).limit(150),
  ]);
  if (accountError) throw new Error(accountError.message);
  if (transactionError) throw new Error(transactionError.message);
  return { accounts: accounts ?? [], transactions: transactions ?? [] };
}

export async function getFinanceReport(days = 30) {
  const today = cairoToday();
  const { admin } = await requireFinanceAdmin();
  const dates = Array.from({ length: days }, (_, index) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (days - 1 - index));
    return d.toISOString().slice(0, 10);
  });
  const rows = await Promise.all(dates.map(async (date) => {
    const { data, error } = await admin.schema('now').rpc('finance_dashboard_summary', { p_date: date });
    if (error) throw new Error(error.message);
    return numberify((data ?? {}) as FinanceSummary, ['completed_orders','gmv','collections','actual_product_cost','trip_cost','payroll_cost','operating_expenses','contribution_profit','operating_profit'] as Array<keyof FinanceSummary>);
  }));
  return rows;
}
