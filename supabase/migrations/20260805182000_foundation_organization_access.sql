-- RHTrevo: foundation for a configurable organization and access model.
-- This migration is intentionally not applied automatically. Review it before linking
-- the Supabase CLI and applying it to the Rhtrevo development project.

create extension if not exists pgcrypto;

create type public.system_role as enum ('root_admin', 'admin', 'rh', 'manager', 'collaborator', 'auditor');
create type public.assignment_kind as enum ('employment', 'functional', 'technical', 'process', 'portfolio', 'temporary');
create type public.relation_kind as enum ('direct_manager', 'secondary_manager', 'functional_owner', 'technical_owner', 'approver', 'reviewer', 'mentor', 'delegate', 'focal_point');
create type public.permission_effect as enum ('allow', 'deny');
create type public.sensitivity_classification as enum ('operational', 'personal', 'financial', 'medical', 'disciplinary', 'performance', 'document');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.system_role not null,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references public.profiles(id),
  reason text,
  created_at timestamptz not null default now(),
  constraint user_roles_active_dates check (ends_at is null or ends_at > starts_at),
  unique (user_id, role, starts_at)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  registration_number text,
  active boolean not null default true,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.org_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  parent_unit_id uuid references public.org_units(id) on delete restrict,
  name text not null,
  code text,
  active boolean not null default true,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.org_areas (
  id uuid primary key default gen_random_uuid(),
  parent_area_id uuid references public.org_areas(id) on delete restrict,
  name text not null,
  code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete restrict,
  unit_id uuid references public.org_units(id) on delete restrict,
  area_id uuid references public.org_areas(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cbo_code text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  work_email text unique,
  employee_code text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  kind public.assignment_kind not null default 'employment',
  company_id uuid references public.companies(id) on delete restrict,
  unit_id uuid references public.org_units(id) on delete restrict,
  area_id uuid references public.org_areas(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict,
  job_role_id uuid references public.job_roles(id) on delete restrict,
  is_primary boolean not null default false,
  starts_at date not null default current_date,
  ends_at date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_assignments_scope check (company_id is not null or unit_id is not null or area_id is not null or team_id is not null),
  constraint employee_assignments_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index employee_assignments_one_primary_active
  on public.employee_assignments(employee_id)
  where is_primary = true and ends_at is null;

create table public.employee_relationships (
  id uuid primary key default gen_random_uuid(),
  subject_employee_id uuid not null references public.employees(id) on delete cascade,
  related_employee_id uuid not null references public.employees(id) on delete cascade,
  kind public.relation_kind not null,
  company_id uuid references public.companies(id) on delete restrict,
  unit_id uuid references public.org_units(id) on delete restrict,
  area_id uuid references public.org_areas(id) on delete restrict,
  starts_at date not null default current_date,
  ends_at date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_relationships_distinct_people check (subject_employee_id <> related_employee_id),
  constraint employee_relationships_dates check (ends_at is null or ends_at >= starts_at)
);

create unique index employee_relationships_one_active_direct_manager
  on public.employee_relationships(subject_employee_id)
  where kind = 'direct_manager' and ends_at is null;

create table public.responsibility_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.assignment_responsibilities (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.employee_assignments(id) on delete cascade,
  responsibility_id uuid not null references public.responsibility_catalog(id) on delete restrict,
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  unique (assignment_id, responsibility_id, starts_at),
  constraint assignment_responsibilities_dates check (ends_at is null or ends_at >= starts_at)
);

create table public.permission_catalog (
  key text primary key,
  module text not null,
  label text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.autonomy_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.autonomy_level_permissions (
  id uuid primary key default gen_random_uuid(),
  autonomy_level_id uuid not null references public.autonomy_levels(id) on delete cascade,
  permission_key text not null references public.permission_catalog(key) on delete restrict,
  effect public.permission_effect not null default 'allow',
  unique (autonomy_level_id, permission_key)
);

create table public.user_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permission_catalog(key) on delete restrict,
  effect public.permission_effect not null,
  company_id uuid references public.companies(id) on delete restrict,
  unit_id uuid references public.org_units(id) on delete restrict,
  area_id uuid references public.org_areas(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete restrict,
  classification public.sensitivity_classification,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references public.profiles(id),
  reason text not null,
  created_at timestamptz not null default now(),
  constraint user_permission_grants_dates check (ends_at is null or ends_at > starts_at)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  origin text not null default 'ui' check (origin in ('ui', 'api', 'g4os', 'import', 'system')),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  request_summary text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_lookup on public.audit_logs(entity_type, entity_id, created_at desc);
create index employee_assignments_employee_lookup on public.employee_assignments(employee_id, starts_at desc);
create index employee_relationships_subject_lookup on public.employee_relationships(subject_employee_id, kind, starts_at desc);
create index user_permission_grants_user_lookup on public.user_permission_grants(user_id, permission_key, starts_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('root_admin', 'admin')
      and active = true
      and starts_at <= now()
      and (ends_at is null or ends_at > now())
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.org_units enable row level security;
alter table public.org_areas enable row level security;
alter table public.teams enable row level security;
alter table public.job_roles enable row level security;
alter table public.employees enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.employee_relationships enable row level security;
alter table public.responsibility_catalog enable row level security;
alter table public.assignment_responsibilities enable row level security;
alter table public.permission_catalog enable row level security;
alter table public.autonomy_levels enable row level security;
alter table public.autonomy_level_permissions enable row level security;
alter table public.user_permission_grants enable row level security;
alter table public.audit_logs enable row level security;

-- The first phase is intentionally private. Only bootstrap administrators can use
-- configuration data. Granular policies will be added once the permission engine
-- is implemented and tested with representative users.
create policy "admins manage profiles" on public.profiles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage roles" on public.user_roles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage companies" on public.companies for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage units" on public.org_units for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage areas" on public.org_areas for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage teams" on public.teams for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage job roles" on public.job_roles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage employees" on public.employees for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage assignments" on public.employee_assignments for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage relationships" on public.employee_relationships for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage responsibilities" on public.responsibility_catalog for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage assignment responsibilities" on public.assignment_responsibilities for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage permission catalog" on public.permission_catalog for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage autonomy levels" on public.autonomy_levels for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage autonomy permissions" on public.autonomy_level_permissions for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins manage user permission grants" on public.user_permission_grants for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins view audit logs" on public.audit_logs for select using (public.is_platform_admin());

-- Explicit grants in the same migration. The policy remains the enforcement layer.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
