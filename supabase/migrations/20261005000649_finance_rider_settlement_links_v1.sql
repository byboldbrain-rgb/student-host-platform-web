alter table now.finance_order_costs
  add column if not exists settlement_id uuid
  references now.finance_rider_settlements(id) on delete set null;

create index if not exists finance_order_costs_settlement_idx
  on now.finance_order_costs(settlement_id);

grant select, insert, update, delete
  on now.finance_order_costs
  to service_role;
