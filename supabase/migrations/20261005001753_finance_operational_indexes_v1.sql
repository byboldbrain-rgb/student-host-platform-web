create index if not exists finance_attendance_employee_idx
  on now.finance_attendance(employee_id);

create index if not exists finance_payroll_employee_idx
  on now.finance_payroll(employee_id);

create index if not exists finance_order_item_costs_rider_idx
  on now.finance_order_item_costs(rider_employee_id);

create index if not exists finance_rider_advances_settlement_idx
  on now.finance_rider_advances(settlement_id);

create index if not exists finance_trips_driver_idx
  on now.finance_trips(driver_employee_id);

create index if not exists finance_expenses_order_idx
  on now.finance_expenses(related_order_id);

create index if not exists finance_expenses_trip_idx
  on now.finance_expenses(related_trip_id);

create index if not exists finance_expenses_employee_idx
  on now.finance_expenses(related_employee_id);
