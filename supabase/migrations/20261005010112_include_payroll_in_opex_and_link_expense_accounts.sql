alter table now.finance_expenses
  add column if not exists payment_account_id uuid references now.finance_cash_accounts(id) on delete restrict,
  add column if not exists cash_transaction_id uuid references now.finance_cash_transactions(id) on delete set null;

create index if not exists finance_expenses_payment_account_idx
  on now.finance_expenses(payment_account_id);

create unique index if not exists finance_expenses_cash_transaction_unique_idx
  on now.finance_expenses(cash_transaction_id)
  where cash_transaction_id is not null;

create or replace function now.create_finance_expense_with_payment(
  p_expense_date date,
  p_category text,
  p_cost_center text,
  p_vendor text,
  p_description text,
  p_amount numeric,
  p_payment_account_id uuid,
  p_receipt_url text default null,
  p_related_order_id uuid default null,
  p_related_trip_id uuid default null,
  p_related_employee_id uuid default null,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = 'now', 'public', 'pg_temp'
as $$
declare
  v_account now.finance_cash_accounts%rowtype;
  v_expense_id uuid;
  v_cash_transaction_id uuid;
  v_book_balance numeric;
begin
  if nullif(btrim(p_description), '') is null then
    raise exception 'Expense description is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Expense amount must be greater than zero.';
  end if;

  select *
  into v_account
  from now.finance_cash_accounts
  where id = p_payment_account_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Select an active payment account.';
  end if;

  select v_account.opening_balance + coalesce(sum(
    case when t.direction = 'in' then t.amount else -t.amount end
  ), 0)
  into v_book_balance
  from now.finance_cash_transactions t
  where t.account_id = v_account.id;

  if v_book_balance < p_amount then
    raise exception 'Insufficient book balance in account %. Available: % EGP, required: % EGP.',
      v_account.account_name, v_book_balance, p_amount;
  end if;

  insert into now.finance_expenses (
    expense_date,
    category,
    cost_center,
    vendor,
    description,
    amount,
    payment_method,
    payment_account_id,
    receipt_url,
    related_order_id,
    related_trip_id,
    related_employee_id,
    status,
    notes,
    created_by,
    approved_by
  ) values (
    coalesce(p_expense_date, (now() at time zone 'Africa/Cairo')::date),
    coalesce(nullif(btrim(p_category), ''), 'other'),
    coalesce(nullif(btrim(p_cost_center), ''), 'operations'),
    nullif(btrim(p_vendor), ''),
    btrim(p_description),
    p_amount,
    v_account.account_type,
    v_account.id,
    nullif(btrim(p_receipt_url), ''),
    p_related_order_id,
    p_related_trip_id,
    p_related_employee_id,
    'approved',
    nullif(btrim(p_notes), ''),
    p_created_by,
    p_created_by
  ) returning id into v_expense_id;

  insert into now.finance_cash_transactions (
    account_id,
    transaction_at,
    direction,
    category,
    amount,
    counterparty,
    description,
    reference_type,
    reference_id,
    payment_method,
    reconciled,
    created_by
  ) values (
    v_account.id,
    now(),
    'out',
    'expense',
    p_amount,
    nullif(btrim(p_vendor), ''),
    btrim(p_description),
    'expense',
    v_expense_id::text,
    v_account.account_type,
    false,
    p_created_by
  ) returning id into v_cash_transaction_id;

  update now.finance_expenses
  set cash_transaction_id = v_cash_transaction_id,
      updated_at = now()
  where id = v_expense_id;

  return v_expense_id;
end;
$$;

revoke all on function now.create_finance_expense_with_payment(date,text,text,text,text,numeric,uuid,text,uuid,uuid,uuid,text,uuid) from public, anon, authenticated;
grant execute on function now.create_finance_expense_with_payment(date,text,text,text,text,numeric,uuid,text,uuid,uuid,uuid,text,uuid) to service_role;

create or replace function now.finance_dashboard_summary(p_date date default ((now() at time zone 'Africa/Cairo'))::date)
returns jsonb
language sql
stable
set search_path to 'now', 'public', 'pg_temp'
as $$
with day_orders as (
  select o.*
  from now.orders o
  where o.status = 'delivered'
    and (coalesce(o.delivered_at, o.created_at) at time zone 'Africa/Cairo')::date = p_date
), order_cost as (
  select
    c.order_id,
    c.actual_product_cost,
    c.packaging_cost + c.pickup_cost + c.payment_gateway_cost + c.refund_cost + c.other_variable_cost as other_variable_cost
  from now.finance_order_costs c
), trip_alloc as (
  select tord.order_id, sum(tord.allocated_cost) as trip_cost
  from now.finance_trip_orders tord
  join now.finance_trips t on t.id = tord.trip_id and t.status <> 'cancelled'
  group by tord.order_id
), order_rollup as (
  select
    d.id,
    d.subtotal,
    d.delivery_fee,
    d.payment_processing_fee,
    d.voucher_discount_amount + d.spin_discount_amount as discounts,
    d.total_amount,
    coalesce(c.actual_product_cost, 0) as actual_product_cost,
    coalesce(c.other_variable_cost, 0) as other_variable_cost,
    coalesce(ta.trip_cost, 0) as trip_cost,
    (c.order_id is not null and c.actual_product_cost > 0) as has_purchase_cost,
    (ta.order_id is not null) as has_trip_cost
  from day_orders d
  left join order_cost c on c.order_id = d.id
  left join trip_alloc ta on ta.order_id = d.id
), days_in_month as (
  select extract(day from (date_trunc('month', p_date::timestamp) + interval '1 month - 1 day'))::numeric as n
), monthly_payroll as (
  select coalesce(sum(e.base_rate / nullif(dim.n,0)),0) as amount
  from now.finance_employees e cross join days_in_month dim
  where e.pay_basis = 'monthly'
    and e.start_date <= p_date
    and (e.end_date is null or e.end_date >= p_date)
), attendance_payroll as (
  select coalesce(sum(
    case e.pay_basis
      when 'daily' then e.base_rate
      when 'hourly' then a.actual_hours * e.base_rate
      when 'per_order' then a.orders_handled * e.base_rate
      when 'per_trip' then a.trips_handled * e.base_rate
      when 'monthly' then 0
      else 0
    end
    + (a.overtime_hours * e.overtime_rate)
    + (a.orders_handled * e.incentive_per_order)
    + (a.trips_handled * e.incentive_per_trip)
    + a.bonus - a.deduction
  ),0) as amount
  from now.finance_attendance a
  join now.finance_employees e on e.id = a.employee_id
  where a.work_date = p_date and a.approved = true
), other_opex as (
  select coalesce(sum(e.amount),0) as amount
  from now.finance_expenses e
  where e.expense_date = p_date and e.status = 'approved'
    and e.category not in ('product_purchase','trip_cost','payroll')
), base as (
  select
    count(*)::int as completed_orders,
    coalesce(sum(subtotal),0) as gmv,
    coalesce(sum(total_amount),0) as collections,
    coalesce(sum(delivery_fee),0) as delivery_revenue,
    coalesce(sum(payment_processing_fee),0) as payment_fee_revenue,
    coalesce(sum(discounts),0) as discounts,
    coalesce(sum(actual_product_cost),0) as actual_product_cost,
    coalesce(sum(trip_cost),0) as trip_cost,
    coalesce(sum(other_variable_cost),0) as other_variable_cost,
    count(*) filter (where has_purchase_cost)::int as known_purchase_orders,
    count(*) filter (where not has_purchase_cost)::int as missing_purchase_cost_orders,
    count(*) filter (where not has_trip_cost)::int as missing_trip_orders
  from order_rollup
), calc as (
  select
    b.*,
    (b.collections - b.actual_product_cost - b.trip_cost - b.other_variable_cost) as contribution_profit,
    (mp.amount + ap.amount) as payroll_cost,
    ox.amount as non_payroll_operating_expenses,
    (mp.amount + ap.amount + ox.amount) as operating_expenses
  from base b cross join monthly_payroll mp cross join attendance_payroll ap cross join other_opex ox
)
select jsonb_build_object(
  'date', p_date,
  'completed_orders', c.completed_orders,
  'gmv', c.gmv,
  'collections', c.collections,
  'delivery_revenue', c.delivery_revenue,
  'payment_fee_revenue', c.payment_fee_revenue,
  'discounts', c.discounts,
  'actual_product_cost', c.actual_product_cost,
  'trip_cost', c.trip_cost,
  'other_variable_cost', c.other_variable_cost,
  'contribution_profit', c.contribution_profit,
  'payroll_cost', c.payroll_cost,
  'non_payroll_operating_expenses', c.non_payroll_operating_expenses,
  'operating_expenses', c.operating_expenses,
  'operating_profit', c.contribution_profit - c.operating_expenses,
  'contribution_per_order', case when c.completed_orders > 0 then c.contribution_profit / c.completed_orders else 0 end,
  'operating_profit_per_order', case when c.completed_orders > 0 then (c.contribution_profit - c.operating_expenses) / c.completed_orders else 0 end,
  'known_purchase_orders', c.known_purchase_orders,
  'missing_purchase_cost_orders', c.missing_purchase_cost_orders,
  'missing_trip_orders', c.missing_trip_orders,
  'breakeven_orders', case when c.completed_orders > 0 and c.contribution_profit > 0 then ceil(c.operating_expenses / nullif(c.contribution_profit / c.completed_orders,0)) else null end
) from calc c;
$$;
