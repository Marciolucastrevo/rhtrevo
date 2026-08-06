-- RHTrevo: first slice of the employee journey.
-- Stores only document references and metadata. Binary content, secrets and external storage are deliberately out of scope.

create or replace function public.can_manage_employee_journey()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('root_admin', 'admin', 'rh')
      and active = true
      and starts_at <= now()
      and (ends_at is null or ends_at > now())
  );
$$;

revoke all on function public.can_manage_employee_journey() from public;
grant execute on function public.can_manage_employee_journey() to authenticated;

create table public.employee_document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  default_classification public.sensitivity_classification not null default 'document',
  requires_expiry boolean not null default false,
  active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_document_types_category_check check (category in ('identity', 'employment', 'benefits', 'health_safety', 'training', 'performance', 'other'))
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  document_type_id uuid references public.employee_document_types(id) on delete set null,
  title text not null,
  reference_code text,
  classification public.sensitivity_classification not null default 'document',
  status text not null default 'pending',
  issued_at date,
  expires_at date,
  reviewed_at date,
  reviewed_by uuid references public.profiles(id) on delete set null,
  document_url text,
  notes text,
  is_confidential boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_documents_status_check check (status in ('pending', 'valid', 'expired', 'under_review', 'rejected', 'archived')),
  constraint employee_documents_dates_check check (expires_at is null or issued_at is null or expires_at >= issued_at),
  constraint employee_documents_url_check check (document_url is null or document_url ~* '^https?://')
);

create table public.employee_occurrences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  occurrence_type text not null,
  severity text not null default 'low',
  occurred_on date not null default current_date,
  description text not null,
  is_confidential boolean not null default false,
  status text not null default 'open',
  resolved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_occurrences_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint employee_occurrences_status_check check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  constraint employee_occurrences_resolved_check check (resolved_at is null or resolved_at >= occurred_on)
);

create table public.employee_communications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  subject text not null,
  message text not null,
  channel text not null default 'platform',
  sent_at timestamptz,
  read_at timestamptz,
  is_confidential boolean not null default false,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_communications_channel_check check (channel in ('platform', 'email', 'whatsapp', 'in_person', 'other')),
  constraint employee_communications_status_check check (status in ('draft', 'sent', 'read', 'archived')),
  constraint employee_communications_dates_check check (read_at is null or sent_at is null or read_at >= sent_at)
);

create index employee_documents_employee_lookup on public.employee_documents(employee_id, status, expires_at);
create index employee_occurrences_employee_lookup on public.employee_occurrences(employee_id, occurred_on desc);
create index employee_communications_employee_lookup on public.employee_communications(employee_id, sent_at desc);

alter table public.employee_document_types enable row level security;
alter table public.employee_documents enable row level security;
alter table public.employee_occurrences enable row level security;
alter table public.employee_communications enable row level security;

create policy "journey managers manage document types" on public.employee_document_types
  for all using (public.can_manage_employee_journey()) with check (public.can_manage_employee_journey());
create policy "journey managers manage documents" on public.employee_documents
  for all using (public.can_manage_employee_journey()) with check (public.can_manage_employee_journey());
create policy "journey managers manage occurrences" on public.employee_occurrences
  for all using (public.can_manage_employee_journey()) with check (public.can_manage_employee_journey());
create policy "journey managers manage communications" on public.employee_communications
  for all using (public.can_manage_employee_journey()) with check (public.can_manage_employee_journey());

-- A person can see only their own non-confidential journey records when linked to auth user_id.
create policy "employees read own non confidential documents" on public.employee_documents
  for select using (
    not is_confidential
    and exists (select 1 from public.employees where employees.id = employee_documents.employee_id and employees.user_id = auth.uid())
  );
create policy "employees read own non confidential occurrences" on public.employee_occurrences
  for select using (
    not is_confidential
    and exists (select 1 from public.employees where employees.id = employee_occurrences.employee_id and employees.user_id = auth.uid())
  );
create policy "employees read own non confidential communications" on public.employee_communications
  for select using (
    not is_confidential
    and exists (select 1 from public.employees where employees.id = employee_communications.employee_id and employees.user_id = auth.uid())
  );

insert into public.permission_catalog (key, module, label, description) values
  ('journey.read', 'journey', 'Consultar jornada do colaborador', 'Consultar documentos, ocorrências e comunicados da jornada.'),
  ('journey.manage', 'journey', 'Administrar jornada do colaborador', 'Registrar e atualizar documentos, ocorrências e comunicados da jornada.')
on conflict (key) do update set label = excluded.label, description = excluded.description, active = true;

create trigger audit_employee_document_types
  after insert or update or delete on public.employee_document_types
  for each row execute function public.audit_administrative_change();
create trigger audit_employee_documents
  after insert or update or delete on public.employee_documents
  for each row execute function public.audit_administrative_change();
create trigger audit_employee_occurrences
  after insert or update or delete on public.employee_occurrences
  for each row execute function public.audit_administrative_change();
create trigger audit_employee_communications
  after insert or update or delete on public.employee_communications
  for each row execute function public.audit_administrative_change();
