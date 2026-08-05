-- RHTrevo: identifiers required for controlled ERP employee imports.
-- ERP company and employee codes are source identifiers. Employee codes repeat
-- across companies, so uniqueness belongs to an assignment scoped to a company.

alter table public.companies
  add column if not exists external_code text;

alter table public.companies
  drop constraint if exists companies_name_key;

create unique index if not exists companies_external_code_unique
  on public.companies (external_code)
  where external_code is not null;

alter table public.employees
  drop constraint if exists employees_employee_code_key;

alter table public.employee_assignments
  add column if not exists source_employee_code text;

create unique index if not exists employee_assignments_active_company_source_code_unique
  on public.employee_assignments (company_id, source_employee_code)
  where source_employee_code is not null and ends_at is null;
