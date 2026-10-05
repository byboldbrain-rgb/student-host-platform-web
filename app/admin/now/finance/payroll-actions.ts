'use server';

import { revalidatePath } from 'next/cache';

import { monthStart, requireFinanceAdmin } from './lib/finance-data';

function text(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function nextMonthStart(month: string) {
  const [year, monthNumber] = month.slice(0, 7).split('-').map(Number);
  const next = monthNumber === 12
    ? { year: year + 1, month: 1 }
    : { year, month: monthNumber + 1 };
  return `${next.year}-${String(next.month).padStart(2, '0')}-01`;
}

export async function generatePayrollAction(formData: FormData) {
  const payrollMonth = monthStart(text(formData, 'payroll_month'));
  const monthEndExclusive = nextMonthStart(payrollMonth);
  const { admin, access } = await requireFinanceAdmin();

  const [employeesResult, attendanceResult, existingResult] = await Promise.all([
    admin
      .schema('now')
      .from('finance_employees')
      .select('*')
      .lt('start_date', monthEndExclusive)
      .or(`end_date.is.null,end_date.gte.${payrollMonth}`),
    admin
      .schema('now')
      .from('finance_attendance')
      .select('*')
      .gte('work_date', payrollMonth)
      .lt('work_date', monthEndExclusive)
      .eq('approved', true),
    admin.schema('now').from('finance_payroll').select('*').eq('payroll_month', payrollMonth),
  ]);

  if (employeesResult.error) throw new Error(employeesResult.error.message);
  if (attendanceResult.error) throw new Error(attendanceResult.error.message);
  if (existingResult.error) throw new Error(existingResult.error.message);

  const employees = employeesResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const existingByEmployee = new Map((existingResult.data ?? []).map((row) => [row.employee_id, row]));

  const rows = employees.map((employee) => {
    const records = attendance.filter((row) => row.employee_id === employee.id);
    const daysWorked = new Set(records.map((row) => row.work_date)).size;
    const hoursWorked = records.reduce((sum, row) => sum + Number(row.actual_hours ?? 0), 0);
    const overtimeHours = records.reduce((sum, row) => sum + Number(row.overtime_hours ?? 0), 0);
    const ordersHandled = records.reduce((sum, row) => sum + Number(row.orders_handled ?? 0), 0);
    const tripsHandled = records.reduce((sum, row) => sum + Number(row.trips_handled ?? 0), 0);
    const allowances = records.reduce((sum, row) => sum + Number(row.bonus ?? 0), 0);
    const deductions = records.reduce((sum, row) => sum + Number(row.deduction ?? 0), 0);
    const baseRate = Number(employee.base_rate ?? 0);

    const basePay = employee.pay_basis === 'monthly'
      ? baseRate
      : employee.pay_basis === 'daily'
        ? daysWorked * baseRate
        : employee.pay_basis === 'hourly'
          ? hoursWorked * baseRate
          : employee.pay_basis === 'per_order'
            ? ordersHandled * baseRate
            : employee.pay_basis === 'per_trip'
              ? tripsHandled * baseRate
              : 0;

    const overtimePay = overtimeHours * Number(employee.overtime_rate ?? 0);
    const incentives =
      ordersHandled * Number(employee.incentive_per_order ?? 0)
      + tripsHandled * Number(employee.incentive_per_trip ?? 0);
    const netPay = Math.max(0, basePay + overtimePay + incentives + allowances - deductions);
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
    const { error } = await admin
      .schema('now')
      .from('finance_payroll')
      .upsert(rows, { onConflict: 'payroll_month,employee_id' });
    if (error) throw new Error(error.message);
  }

  const { error: auditError } = await admin.schema('now').from('finance_audit_log').insert({
    entity_type: 'payroll',
    entity_id: payrollMonth,
    action: 'generate',
    old_data: existingResult.data ?? [],
    new_data: rows,
    actor_user_id: access.user_id,
  });
  if (auditError) throw new Error(auditError.message);

  revalidatePath('/admin/now/finance');
  revalidatePath('/admin/now/finance/payroll');
}
