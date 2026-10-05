create table if not exists now.finance_settings (
  id smallint primary key default 1 check (id = 1),
  currency_code text not null default 'EGP',
  timezone text not null default 'Africa/Cairo',
  default_trip_cost numeric(12,2) not null default 140 check (default_trip_cost >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id)
);

insert into now.finance_settings (id) values (1) on conflict (id) do nothing;

create table if not exists now.finance_employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique,
  full_name text not null,
  phone text,
  role text not null check (role in ('pickup_rider','maallemeen_hub','hadaba_delivery','operations','customer_success','finance','other')),
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contractor','temporary')),
  pay_basis text not null default 'monthly' check (pay_basis in ('monthly','daily','hourly','per_order','per_trip')),
  base_rate numeric(12,2) not null default 0 check (base_rate >= 0),
  overtime_rate numeric(12,2) not null default 0 check (overtime_rate >= 0),
  incentive_per_order numeric(12,2) not null default 0 check (incentive_per_order >= 0),
  incentive_per_trip numeric(12,2) not null default 0 check (incentive_per_trip >= 0),
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists finance_employees_role_active_idx on now.finance_employees(role, is_active);

create table if not exists now.finance_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references now.finance_employees(id) on delete cascade,
  work_date date not null,
  shift_label text,
  scheduled_hours numeric(6,2) not null default 0 check (scheduled_hours >= 0),
  actual_hours numeric(6,2) not null default 0 check (actual_hours >= 0),
  overtime_hours numeric(6,2) not null default 0 check (overtime_hours >= 0),
  orders_handled integer not null default 0 check (orders_handled >= 0),
  trips_handled integer not null default 0 check (trips_handled >= 0),
  bonus numeric(12,2) not null default 0 check (bonus >= 0),
  deduction numeric(12,2) not null default 0 check (deduction >= 0),
  approved boolean not null default true,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_attendance_date_employee_idx on now.finance_attendance(work_date, employee_id);

create table if not exists now.finance_payroll (
  id uuid primary key default gen_random_uuid(),
  payroll_month date not null,
  employee_id uuid not null references now.finance_employees(id) on delete restrict,
  base_pay numeric(12,2) not null default 0,
  overtime_pay numeric(12,2) not null default 0,
  incentives numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid')),
  paid_at timestamptz,
  payment_method text,
  reference text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_month, employee_id),
  check (paid_amount >= 0)
);

create index if not exists finance_payroll_month_idx on now.finance_payroll(payroll_month);

create table if not exists now.finance_order_costs (
  order_id uuid primary key references now.orders(id) on delete cascade,
  rider_employee_id uuid references now.finance_employees(id) on delete set null,
  purchased_at timestamptz,
  actual_product_cost numeric(12,2) not null default 0 check (actual_product_cost >= 0),
  packaging_cost numeric(12,2) not null default 0 check (packaging_cost >= 0),
  pickup_cost numeric(12,2) not null default 0 check (pickup_cost >= 0),
  payment_gateway_cost numeric(12,2) not null default 0 check (payment_gateway_cost >= 0),
  refund_cost numeric(12,2) not null default 0 check (refund_cost >= 0),
  other_variable_cost numeric(12,2) not null default 0 check (other_variable_cost >= 0),
  receipt_url text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_order_costs_rider_purchase_idx on now.finance_order_costs(rider_employee_id, purchased_at);

create table if not exists now.finance_order_item_costs (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references now.order_items(id) on delete cascade,
  rider_employee_id uuid references now.finance_employees(id) on delete set null,
  actual_unit_cost numeric(12,2) not null check (actual_unit_cost >= 0),
  quantity integer not null check (quantity > 0),
  actual_line_cost numeric(12,2) generated always as (actual_unit_cost * quantity) stored,
  purchased_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists now.finance_rider_settlements (
  id uuid primary key default gen_random_uuid(),
  rider_employee_id uuid not null references now.finance_employees(id) on delete restrict,
  settlement_date date not null,
  advances_amount numeric(12,2) not null default 0,
  purchases_amount numeric(12,2) not null default 0,
  approved_expenses_amount numeric(12,2) not null default 0,
  expected_return_amount numeric(12,2) not null default 0,
  actual_return_amount numeric(12,2) not null default 0,
  variance_amount numeric(12,2) generated always as (actual_return_amount - expected_return_amount) stored,
  status text not null default 'open' check (status in ('open','closed','void')),
  notes text,
  closed_by uuid references auth.users(id),
  closed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rider_employee_id, settlement_date)
);

create table if not exists now.finance_rider_advances (
  id uuid primary key default gen_random_uuid(),
  rider_employee_id uuid not null references now.finance_employees(id) on delete restrict,
  sent_at timestamptz not null default now(),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  reference text,
  notes text,
  settlement_id uuid references now.finance_rider_settlements(id) on delete set null,
  settled boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists finance_rider_advances_rider_date_idx on now.finance_rider_advances(rider_employee_id, sent_at);

create table if not exists now.finance_trips (
  id uuid primary key default gen_random_uuid(),
  trip_code text not null unique,
  trip_date date not null,
  origin text not null default 'المعلمين',
  destination text not null default 'الهضبة',
  departure_time time,
  driver_employee_id uuid references now.finance_employees(id) on delete set null,
  total_cost numeric(12,2) not null default 140 check (total_cost >= 0),
  allocation_method text not null default 'equal' check (allocation_method in ('equal','weighted','manual')),
  status text not null default 'completed' check (status in ('planned','completed','cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_trips_date_idx on now.finance_trips(trip_date);

create table if not exists now.finance_trip_orders (
  trip_id uuid not null references now.finance_trips(id) on delete cascade,
  order_id uuid not null references now.orders(id) on delete cascade,
  allocated_cost numeric(12,2) not null default 0 check (allocated_cost >= 0),
  allocation_weight numeric(10,4) not null default 1 check (allocation_weight > 0),
  created_at timestamptz not null default now(),
  primary key (trip_id, order_id),
  unique (order_id)
);

create index if not exists finance_trip_orders_order_idx on now.finance_trip_orders(order_id);

create table if not exists now.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null,
  cost_center text not null default 'operations',
  vendor text,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  receipt_url text,
  related_order_id uuid references now.orders(id) on delete set null,
  related_trip_id uuid references now.finance_trips(id) on delete set null,
  related_employee_id uuid references now.finance_employees(id) on delete set null,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  notes text,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_expenses_date_status_idx on now.finance_expenses(expense_date, status);

create table if not exists now.finance_cash_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  account_type text not null default 'wallet' check (account_type in ('cash','bank','wallet','other')),
  currency_code text not null default 'EGP',
  opening_balance numeric(14,2) not null default 0,
  actual_balance numeric(14,2),
  is_active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists now.finance_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references now.finance_cash_accounts(id) on delete restrict,
  transaction_at timestamptz not null default now(),
  direction text not null check (direction in ('in','out')),
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  counterparty text,
  description text,
  reference_type text,
  reference_id text,
  payment_method text,
  reconciled boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists finance_cash_transactions_account_date_idx on now.finance_cash_transactions(account_id, transaction_at);

create table if not exists now.finance_daily_closes (
  id uuid primary key default gen_random_uuid(),
  close_date date not null unique,
  status text not null default 'closed' check (status in ('closed','reopened')),
  snapshot jsonb not null default '{}'::jsonb,
  notes text,
  closed_by uuid references auth.users(id),
  closed_at timestamptz not null default now(),
  reopened_by uuid references auth.users(id),
  reopened_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists now.finance_audit_log (
  id bigint generated by default as identity primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists finance_audit_log_entity_idx on now.finance_audit_log(entity_type, entity_id, created_at desc);

alter table now.finance_settings enable row level security;
alter table now.finance_employees enable row level security;
alter table now.finance_attendance enable row level security;
alter table now.finance_payroll enable row level security;
alter table now.finance_order_costs enable row level security;
alter table now.finance_order_item_costs enable row level security;
alter table now.finance_rider_settlements enable row level security;
alter table now.finance_rider_advances enable row level security;
alter table now.finance_trips enable row level security;
alter table now.finance_trip_orders enable row level security;
alter table now.finance_expenses enable row level security;
alter table now.finance_cash_accounts enable row level security;
alter table now.finance_cash_transactions enable row level security;
alter table now.finance_daily_closes enable row level security;
alter table now.finance_audit_log enable row level security;

revoke all on now.finance_settings from anon, authenticated;
revoke all on now.finance_employees from anon, authenticated;
revoke all on now.finance_attendance from anon, authenticated;
revoke all on now.finance_payroll from anon, authenticated;
revoke all on now.finance_order_costs from anon, authenticated;
revoke all on now.finance_order_item_costs from anon, authenticated;
revoke all on now.finance_rider_settlements from anon, authenticated;
revoke all on now.finance_rider_advances from anon, authenticated;
revoke all on now.finance_trips from anon, authenticated;
revoke all on now.finance_trip_orders from anon, authenticated;
revoke all on now.finance_expenses from anon, authenticated;
revoke all on now.finance_cash_accounts from anon, authenticated;
revoke all on now.finance_cash_transactions from anon, authenticated;
revoke all on now.finance_daily_closes from anon, authenticated;
revoke all on now.finance_audit_log from anon, authenticated;

grant select, insert, update, delete on now.finance_settings to service_role;
grant select, insert, update, delete on now.finance_employees to service_role;
grant select, insert, update, delete on now.finance_attendance to service_role;
grant select, insert, update, delete on now.finance_payroll to service_role;
grant select, insert, update, delete on now.finance_order_costs to service_role;
grant select, insert, update, delete on now.finance_order_item_costs to service_role;
grant select, insert, update, delete on now.finance_rider_settlements to service_role;
grant select, insert, update, delete on now.finance_rider_advances to service_role;
grant select, insert, update, delete on now.finance_trips to service_role;
grant select, insert, update, delete on now.finance_trip_orders to service_role;
grant select, insert, update, delete on now.finance_expenses to service_role;
grant select, insert, update, delete on now.finance_cash_accounts to service_role;
grant select, insert, update, delete on now.finance_cash_transactions to service_role;
grant select, insert, update, delete on now.finance_daily_closes to service_role;
grant select, insert, update, delete on now.finance_audit_log to service_role;
grant usage, select on sequence now.finance_audit_log_id_seq to service_role;

create or replace function now.finance_dashboard_summary(p_date date default ((now() at time zone 'Africa/Cairo')::date))
returns jsonb
language sql
stable
security invoker
set search_path = now, public, pg_temp
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
    and e.is_active = true
), variable_payroll as (
  select coalesce(sum(
    case e.pay_basis
      when 'daily' then e.base_rate
      when 'hourly' then a.actual_hours * e.base_rate
      when 'per_order' then a.orders_handled * e.incentive_per_order
      when 'per_trip' then a.trips_handled * e.incentive_per_trip
      when 'monthly' then 0
      else 0
    end
    + (a.overtime_hours * e.overtime_rate)
    + a.bonus - a.deduction
  ),0) as amount
  from now.finance_attendance a
  join now.finance_employees e on e.id = a.employee_id
  where a.work_date = p_date and a.approved = true
), opex as (
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
    (mp.amount + vp.amount) as payroll_cost,
    ox.amount as operating_expenses
  from base b cross join monthly_payroll mp cross join variable_payroll vp cross join opex ox
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
  'operating_expenses', c.operating_expenses,
  'operating_profit', c.contribution_profit - c.payroll_cost - c.operating_expenses,
  'contribution_per_order', case when c.completed_orders > 0 then c.contribution_profit / c.completed_orders else 0 end,
  'operating_profit_per_order', case when c.completed_orders > 0 then (c.contribution_profit - c.payroll_cost - c.operating_expenses) / c.completed_orders else 0 end,
  'known_purchase_orders', c.known_purchase_orders,
  'missing_purchase_cost_orders', c.missing_purchase_cost_orders,
  'missing_trip_orders', c.missing_trip_orders,
  'breakeven_orders', case when c.completed_orders > 0 and c.contribution_profit > 0 then ceil((c.payroll_cost + c.operating_expenses) / nullif(c.contribution_profit / c.completed_orders,0)) else null end
) from calc c;
$$;

create or replace function now.list_finance_order_economics(
  p_date date default ((now() at time zone 'Africa/Cairo')::date),
  p_limit integer default 100
)
returns table (
  order_id uuid,
  order_code text,
  store_name text,
  delivered_at timestamptz,
  subtotal numeric,
  delivery_fee numeric,
  payment_fee numeric,
  discounts numeric,
  total_amount numeric,
  actual_product_cost numeric,
  trip_cost numeric,
  other_variable_cost numeric,
  contribution_profit numeric,
  cost_complete boolean
)
language sql
stable
security invoker
set search_path = now, public, pg_temp
as $$
  select
    o.id,
    o.order_code,
    o.store_name_ar_snapshot,
    o.delivered_at,
    o.subtotal,
    o.delivery_fee,
    o.payment_processing_fee,
    o.voucher_discount_amount + o.spin_discount_amount,
    o.total_amount,
    coalesce(c.actual_product_cost,0),
    coalesce(ta.trip_cost,0),
    coalesce(c.packaging_cost + c.pickup_cost + c.payment_gateway_cost + c.refund_cost + c.other_variable_cost,0),
    o.total_amount
      - coalesce(c.actual_product_cost,0)
      - coalesce(ta.trip_cost,0)
      - coalesce(c.packaging_cost + c.pickup_cost + c.payment_gateway_cost + c.refund_cost + c.other_variable_cost,0),
    (c.order_id is not null and c.actual_product_cost > 0 and ta.order_id is not null)
  from now.orders o
  left join now.finance_order_costs c on c.order_id = o.id
  left join (
    select tord.order_id, sum(tord.allocated_cost) as trip_cost
    from now.finance_trip_orders tord
    join now.finance_trips t on t.id=tord.trip_id and t.status <> 'cancelled'
    group by tord.order_id
  ) ta on ta.order_id = o.id
  where o.status='delivered'
    and (coalesce(o.delivered_at,o.created_at) at time zone 'Africa/Cairo')::date = p_date
  order by coalesce(o.delivered_at,o.created_at) desc
  limit greatest(1, least(p_limit,500));
$$;

revoke all on function now.finance_dashboard_summary(date) from public, anon, authenticated;
revoke all on function now.list_finance_order_economics(date, integer) from public, anon, authenticated;
grant execute on function now.finance_dashboard_summary(date) to service_role;
grant execute on function now.list_finance_order_economics(date, integer) to service_role;
