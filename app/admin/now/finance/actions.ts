'use server';

import { revalidatePath } from 'next/cache';

import { cairoToday, monthStart, requireFinanceAdmin } from './lib/finance-data';

function text(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function nullable(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function money(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(text(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(formData: FormData, key: string) {
  return ['1', 'true', 'on', 'yes'].includes(text(formData, key));
}

function isoOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? new Date(value).toISOString() : null;
}

function nextDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function refresh(...paths: string[]) {
  for (const path of new Set(['/admin/now/finance', ...paths])) revalidatePath(path);
}

async function audit(
  admin: ReturnType<typeof import('@/src/lib/supabase/admin').createAdminClient>,
  actor: string,
  entityType: string,
  entityId: string,
  action: string,
  oldData: unknown,
  newData: unknown,
) {
  await admin.schema('now').from('finance_audit_log').insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_data: oldData ?? null,
    new_data: newData ?? null,
    actor_user_id: actor,
  });
}

export async function saveOrderCostAction(formData: FormData) {
  const orderId = text(formData, 'order_id');
  if (!orderId) throw new Error('Order ID is required.');

  const { admin, access } = await requireFinanceAdmin();
  const { data: before } = await admin.schema('now').from('finance_order_costs').select('*').eq('order_id', orderId).maybeSingle();
  const payload = {
    order_id: orderId,
    rider_employee_id: nullable(formData, 'rider_employee_id'),
    purchased_at: isoOrNull(formData, 'purchased_at'),
    actual_product_cost: Math.max(0, money(formData, 'actual_product_cost')),
    packaging_cost: Math.max(0, money(formData, 'packaging_cost')),
    pickup_cost: Math.max(0, money(formData, 'pickup_cost')),
    payment_gateway_cost: Math.max(0, money(formData, 'payment_gateway_cost')),
    refund_cost: Math.max(0, money(formData, 'refund_cost')),
    other_variable_cost: Math.max(0, money(formData, 'other_variable_cost')),
    receipt_url: nullable(formData, 'receipt_url'),
    notes: nullable(formData, 'notes'),
    created_by: before?.created_by ?? access.user_id,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin.schema('now').from('finance_order_costs').upsert(payload, { onConflict: 'order_id' }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'order_cost', orderId, before ? 'update' : 'create', before, data);
  refresh('/admin/now/finance/orders');
}

export async function createEmployeeAction(formData: FormData) {
  const fullName = text(formData, 'full_name');
  if (!fullName) throw new Error('اسم الموظف مطلوب.');
  const { admin, access } = await requireFinanceAdmin();
  const payload = {
    employee_code: nullable(formData, 'employee_code'),
    full_name: fullName,
    phone: nullable(formData, 'phone'),
    role: text(formData, 'role') || 'other',
    employment_type: text(formData, 'employment_type') || 'full_time',
    pay_basis: text(formData, 'pay_basis') || 'monthly',
    base_rate: Math.max(0, money(formData, 'base_rate')),
    overtime_rate: Math.max(0, money(formData, 'overtime_rate')),
    incentive_per_order: Math.max(0, money(formData, 'incentive_per_order')),
    incentive_per_trip: Math.max(0, money(formData, 'incentive_per_trip')),
    start_date: text(formData, 'start_date') || cairoToday(),
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
  };
  const { data, error } = await admin.schema('now').from('finance_employees').insert(payload).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'employee', data.id, 'create', null, data);
  refresh('/admin/now/finance/team', '/admin/now/finance/payroll', '/admin/now/finance/riders');
}

export async function setEmployeeActiveAction(formData: FormData) {
  const id = text(formData, 'employee_id');
  if (!id) return;
  const { admin, access } = await requireFinanceAdmin();
  const { data: before } = await admin.schema('now').from('finance_employees').select('*').eq('id', id).single();
  const { data, error } = await admin.schema('now').from('finance_employees').update({ is_active: bool(formData, 'is_active'), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'employee', id, 'status_change', before, data);
  refresh('/admin/now/finance/team', '/admin/now/finance/payroll', '/admin/now/finance/riders');
}

export async function addAttendanceAction(formData: FormData) {
  const employeeId = text(formData, 'employee_id');
  const workDate = text(formData, 'work_date') || cairoToday();
  if (!employeeId) throw new Error('اختار الموظف.');
  const { admin, access } = await requireFinanceAdmin();
  const scheduled = Math.max(0, money(formData, 'scheduled_hours'));
  const actual = Math.max(0, money(formData, 'actual_hours'));
  const payload = {
    employee_id: employeeId,
    work_date: workDate,
    shift_label: nullable(formData, 'shift_label'),
    scheduled_hours: scheduled,
    actual_hours: actual,
    overtime_hours: Math.max(0, actual - scheduled),
    orders_handled: Math.max(0, integer(formData, 'orders_handled')),
    trips_handled: Math.max(0, integer(formData, 'trips_handled')),
    bonus: Math.max(0, money(formData, 'bonus')),
    deduction: Math.max(0, money(formData, 'deduction')),
    approved: true,
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
  };
  const { data, error } = await admin.schema('now').from('finance_attendance').insert(payload).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'attendance', data.id, 'create', null, data);
  refresh('/admin/now/finance/team', '/admin/now/finance/payroll');
}

export async function addRiderAdvanceAction(formData: FormData) {
  const riderId = text(formData, 'rider_employee_id');
  const amount = money(formData, 'amount');
  if (!riderId || amount <= 0) throw new Error('المندوب والمبلغ مطلوبان.');
  const { admin, access } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').from('finance_rider_advances').insert({
    rider_employee_id: riderId,
    amount,
    payment_method: nullable(formData, 'payment_method'),
    reference: nullable(formData, 'reference'),
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
  }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'rider_advance', data.id, 'create', null, data);
  refresh('/admin/now/finance/riders', '/admin/now/finance/cash');
}

export async function closeRiderSettlementAction(formData: FormData) {
  const riderId = text(formData, 'rider_employee_id');
  const settlementDate = text(formData, 'settlement_date') || cairoToday();
  const actualReturn = money(formData, 'actual_return_amount');
  if (!riderId) throw new Error('اختار المندوب.');

  const { admin, access } = await requireFinanceAdmin();
  const [{ data: advances, error: advancesError }, { data: costs, error: costsError }] = await Promise.all([
    admin.schema('now').from('finance_rider_advances').select('id,amount').eq('rider_employee_id', riderId).eq('settled', false),
    admin.schema('now').from('finance_order_costs').select('order_id,actual_product_cost').eq('rider_employee_id', riderId).is('settlement_id', null),
  ]);
  if (advancesError) throw new Error(advancesError.message);
  if (costsError) throw new Error(costsError.message);

  const advancesAmount = (advances ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const purchasesAmount = (costs ?? []).reduce((sum, row) => sum + Number(row.actual_product_cost ?? 0), 0);
  const expectedReturn = advancesAmount - purchasesAmount;

  const { data: existing } = await admin.schema('now').from('finance_rider_settlements').select('*').eq('rider_employee_id', riderId).eq('settlement_date', settlementDate).maybeSingle();
  const payload = {
    rider_employee_id: riderId,
    settlement_date: settlementDate,
    advances_amount: advancesAmount,
    purchases_amount: purchasesAmount,
    approved_expenses_amount: 0,
    expected_return_amount: expectedReturn,
    actual_return_amount: actualReturn,
    status: 'closed',
    notes: nullable(formData, 'notes'),
    closed_by: access.user_id,
    closed_at: new Date().toISOString(),
    created_by: existing?.created_by ?? access.user_id,
    updated_at: new Date().toISOString(),
  };
  const { data: settlement, error } = await admin.schema('now').from('finance_rider_settlements').upsert(payload, { onConflict: 'rider_employee_id,settlement_date' }).select().single();
  if (error) throw new Error(error.message);

  const advanceIds = (advances ?? []).map((row) => row.id);
  const orderIds = (costs ?? []).map((row) => row.order_id);
  if (advanceIds.length) {
    const { error: updateAdvancesError } = await admin.schema('now').from('finance_rider_advances').update({ settled: true, settlement_id: settlement.id }).in('id', advanceIds);
    if (updateAdvancesError) throw new Error(updateAdvancesError.message);
  }
  if (orderIds.length) {
    const { error: updateCostsError } = await admin.schema('now').from('finance_order_costs').update({ settlement_id: settlement.id, updated_at: new Date().toISOString() }).in('order_id', orderIds);
    if (updateCostsError) throw new Error(updateCostsError.message);
  }
  await audit(admin, access.user_id, 'rider_settlement', settlement.id, existing ? 'close_update' : 'close', existing, settlement);
  refresh('/admin/now/finance/riders', '/admin/now/finance/cash');
}

export async function createTripAction(formData: FormData) {
  const orderIds = formData.getAll('order_id').filter((value): value is string => typeof value === 'string' && Boolean(value));
  if (!orderIds.length) throw new Error('اختار طلبًا واحدًا على الأقل للرحلة.');
  const totalCost = Math.max(0, money(formData, 'total_cost', 140));
  const date = text(formData, 'trip_date') || cairoToday();
  const { admin, access } = await requireFinanceAdmin();
  const tripCode = `TRIP-${date.replaceAll('-', '')}-${Date.now().toString().slice(-6)}`;

  const { data: trip, error: tripError } = await admin.schema('now').from('finance_trips').insert({
    trip_code: tripCode,
    trip_date: date,
    origin: text(formData, 'origin') || 'المعلمين',
    destination: text(formData, 'destination') || 'الهضبة',
    departure_time: nullable(formData, 'departure_time'),
    driver_employee_id: nullable(formData, 'driver_employee_id'),
    total_cost: totalCost,
    allocation_method: 'equal',
    status: 'completed',
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
  }).select().single();
  if (tripError) throw new Error(tripError.message);

  const base = Math.floor((totalCost / orderIds.length) * 100) / 100;
  let assigned = 0;
  const allocations = orderIds.map((orderId, index) => {
    const allocated = index === orderIds.length - 1 ? Math.round((totalCost - assigned) * 100) / 100 : base;
    assigned += allocated;
    return { trip_id: trip.id, order_id: orderId, allocated_cost: allocated, allocation_weight: 1 };
  });
  const { error: allocationError } = await admin.schema('now').from('finance_trip_orders').insert(allocations);
  if (allocationError) {
    await admin.schema('now').from('finance_trips').delete().eq('id', trip.id);
    throw new Error(allocationError.message.includes('duplicate') ? 'واحد من الطلبات مختار بالفعل في رحلة أخرى.' : allocationError.message);
  }
  await audit(admin, access.user_id, 'trip', trip.id, 'create', null, { ...trip, orders: allocations });
  refresh('/admin/now/finance/trips', '/admin/now/finance/orders');
}

export async function addExpenseAction(formData: FormData) {
  const description = text(formData, 'description');
  const amount = money(formData, 'amount');
  if (!description || amount <= 0) throw new Error('وصف المصروف والمبلغ مطلوبان.');
  const { admin, access } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').from('finance_expenses').insert({
    expense_date: text(formData, 'expense_date') || cairoToday(),
    category: text(formData, 'category') || 'other',
    cost_center: text(formData, 'cost_center') || 'operations',
    vendor: nullable(formData, 'vendor'),
    description,
    amount,
    payment_method: nullable(formData, 'payment_method'),
    receipt_url: nullable(formData, 'receipt_url'),
    related_order_id: nullable(formData, 'related_order_id'),
    related_trip_id: nullable(formData, 'related_trip_id'),
    related_employee_id: nullable(formData, 'related_employee_id'),
    status: 'approved',
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
    approved_by: access.user_id,
  }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'expense', data.id, 'create', null, data);
  refresh('/admin/now/finance/expenses');
}

export async function addCashAccountAction(formData: FormData) {
  const accountName = text(formData, 'account_name');
  if (!accountName) throw new Error('اسم الحساب مطلوب.');
  const { admin, access } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').from('finance_cash_accounts').insert({
    account_name: accountName,
    account_type: text(formData, 'account_type') || 'wallet',
    opening_balance: money(formData, 'opening_balance'),
    actual_balance: text(formData, 'actual_balance') ? money(formData, 'actual_balance') : null,
    notes: nullable(formData, 'notes'),
    created_by: access.user_id,
  }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'cash_account', data.id, 'create', null, data);
  refresh('/admin/now/finance/cash');
}

export async function addCashTransactionAction(formData: FormData) {
  const accountId = text(formData, 'account_id');
  const amount = money(formData, 'amount');
  if (!accountId || amount <= 0) throw new Error('الحساب والمبلغ مطلوبان.');
  const { admin, access } = await requireFinanceAdmin();
  const { data, error } = await admin.schema('now').from('finance_cash_transactions').insert({
    account_id: accountId,
    direction: text(formData, 'direction') === 'in' ? 'in' : 'out',
    category: text(formData, 'category') || 'other',
    amount,
    counterparty: nullable(formData, 'counterparty'),
    description: nullable(formData, 'description'),
    reference_type: nullable(formData, 'reference_type'),
    reference_id: nullable(formData, 'reference_id'),
    payment_method: nullable(formData, 'payment_method'),
    reconciled: bool(formData, 'reconciled'),
    created_by: access.user_id,
  }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'cash_transaction', data.id, 'create', null, data);
  refresh('/admin/now/finance/cash');
}

export async function generatePayrollAction(formData: FormData) {
  const payrollMonth = monthStart(text(formData, 'payroll_month'));
  const monthEnd = nextDate(new Date(`${payrollMonth}T12:00:00Z`).toISOString().slice(0, 8) + new Date(Date.UTC(Number(payrollMonth.slice(0,4)), Number(payrollMonth.slice(5,7)), 0)).getUTCDate().toString().padStart(2, '0'));
  const { admin, access } = await requireFinanceAdmin();
  const [{ data: employees, error: employeeError }, { data: attendance, error: attendanceError }, { data: existing, error: existingError }] = await Promise.all([
    admin.schema('now').from('finance_employees').select('*').lte('start_date', monthEnd).or(`end_date.is.null,end_date.gte.${payrollMonth}`),
    admin.schema('now').from('finance_attendance').select('*').gte('work_date', payrollMonth).lt('work_date', monthEnd).eq('approved', true),
    admin.schema('now').from('finance_payroll').select('*').eq('payroll_month', payrollMonth),
  ]);
  if (employeeError) throw new Error(employeeError.message);
  if (attendanceError) throw new Error(attendanceError.message);
  if (existingError) throw new Error(existingError.message);

  const existingByEmployee = new Map((existing ?? []).map((row) => [row.employee_id, row]));
  const rows = (employees ?? []).map((employee) => {
    const records = (attendance ?? []).filter((row) => row.employee_id === employee.id);
    const daysWorked = new Set(records.map((row) => row.work_date)).size;
    const hours = records.reduce((sum, row) => sum + Number(row.actual_hours ?? 0), 0);
    const overtimeHours = records.reduce((sum, row) => sum + Number(row.overtime_hours ?? 0), 0);
    const orders = records.reduce((sum, row) => sum + Number(row.orders_handled ?? 0), 0);
    const trips = records.reduce((sum, row) => sum + Number(row.trips_handled ?? 0), 0);
    const allowances = records.reduce((sum, row) => sum + Number(row.bonus ?? 0), 0);
    const deductions = records.reduce((sum, row) => sum + Number(row.deduction ?? 0), 0);
    const baseRate = Number(employee.base_rate ?? 0);
    const basePay = employee.pay_basis === 'monthly' ? baseRate
      : employee.pay_basis === 'daily' ? daysWorked * baseRate
        : employee.pay_basis === 'hourly' ? hours * baseRate
          : 0;
    const overtimePay = overtimeHours * Number(employee.overtime_rate ?? 0);
    const incentives = orders * Number(employee.incentive_per_order ?? 0) + trips * Number(employee.incentive_per_trip ?? 0);
    const netPay = basePay + overtimePay + incentives + allowances - deductions;
    const old = existingByEmployee.get(employee.id);
    const paidAmount = Number(old?.paid_amount ?? 0);
    return {
      payroll_month: payrollMonth,
      employee_id: employee.id,
      base_pay: basePay,
      overtime_pay: overtimePay,
      incentives,
      allowances,
      deductions,
      net_pay: netPay,
      paid_amount: paidAmount,
      status: paidAmount >= netPay && netPay > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      created_by: old?.created_by ?? access.user_id,
      updated_at: new Date().toISOString(),
    };
  });
  if (rows.length) {
    const { error } = await admin.schema('now').from('finance_payroll').upsert(rows, { onConflict: 'payroll_month,employee_id' });
    if (error) throw new Error(error.message);
  }
  await audit(admin, access.user_id, 'payroll', payrollMonth, 'generate', existing, rows);
  refresh('/admin/now/finance/payroll');
}

export async function markPayrollPaidAction(formData: FormData) {
  const payrollId = text(formData, 'payroll_id');
  const paidAmount = Math.max(0, money(formData, 'paid_amount'));
  if (!payrollId) return;
  const { admin, access } = await requireFinanceAdmin();
  const { data: before, error: readError } = await admin.schema('now').from('finance_payroll').select('*').eq('id', payrollId).single();
  if (readError) throw new Error(readError.message);
  const status = paidAmount >= Number(before.net_pay) && Number(before.net_pay) > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
  const { data, error } = await admin.schema('now').from('finance_payroll').update({
    paid_amount: paidAmount,
    status,
    paid_at: paidAmount > 0 ? new Date().toISOString() : null,
    payment_method: nullable(formData, 'payment_method'),
    reference: nullable(formData, 'reference'),
    updated_at: new Date().toISOString(),
  }).eq('id', payrollId).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'payroll_row', payrollId, 'payment_update', before, data);
  refresh('/admin/now/finance/payroll');
}

export async function closeFinanceDayAction(formData: FormData) {
  const closeDate = text(formData, 'close_date') || cairoToday();
  const { admin, access } = await requireFinanceAdmin();
  const { data: summary, error: summaryError } = await admin.schema('now').rpc('finance_dashboard_summary', { p_date: closeDate });
  if (summaryError) throw new Error(summaryError.message);
  if (Number(summary?.missing_purchase_cost_orders ?? 0) > 0) throw new Error('لا يمكن إغلاق اليوم: توجد طلبات بدون تكلفة شراء فعلية.');
  if (Number(summary?.missing_trip_orders ?? 0) > 0) throw new Error('لا يمكن إغلاق اليوم: توجد طلبات بدون رحلة موزعة.');
  const { count: openAdvances, error: advanceError } = await admin.schema('now').from('finance_rider_advances').select('id', { count: 'exact', head: true }).eq('settled', false);
  if (advanceError) throw new Error(advanceError.message);
  if ((openAdvances ?? 0) > 0) throw new Error('لا يمكن إغلاق اليوم: توجد عهد مندوبين غير مسوّاة.');

  const { data: existing } = await admin.schema('now').from('finance_daily_closes').select('*').eq('close_date', closeDate).maybeSingle();
  const payload = {
    close_date: closeDate,
    status: 'closed',
    snapshot: summary,
    notes: nullable(formData, 'notes'),
    closed_by: access.user_id,
    closed_at: new Date().toISOString(),
  };
  const { data, error } = await admin.schema('now').from('finance_daily_closes').upsert(payload, { onConflict: 'close_date' }).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, access.user_id, 'daily_close', closeDate, existing ? 'reclose' : 'close', existing, data);
  refresh('/admin/now/finance/reports');
}
