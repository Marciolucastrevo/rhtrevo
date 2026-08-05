-- RHTrevo: common authorization catalog and automatic administrative audit.
-- Does not change imported companies, people, or source assignments.

insert into public.permission_catalog (key, module, label, description) values
  ('organization.read', 'organization', 'Consultar estrutura organizacional', 'Consultar empresas, unidades, áreas, equipes e cargos.'),
  ('organization.manage', 'organization', 'Administrar estrutura organizacional', 'Criar, alterar, ativar ou inativar estrutura organizacional.'),
  ('people.read', 'people', 'Consultar pessoas', 'Consultar cadastros de pessoas e seus vínculos.'),
  ('people.manage', 'people', 'Administrar pessoas', 'Criar, alterar, ativar ou inativar pessoas.'),
  ('assignments.manage', 'people', 'Administrar vínculos', 'Criar, encerrar e ajustar vínculos organizacionais.'),
  ('relationships.manage', 'people', 'Administrar relações', 'Configurar gestores, responsáveis e relações funcionais.'),
  ('responsibilities.manage', 'responsibilities', 'Administrar responsabilidades', 'Criar e atribuir responsabilidades.'),
  ('authorization.manage', 'authorization', 'Administrar autorizações', 'Conceder ou revogar permissões, escopos e vigências.'),
  ('audit.read', 'audit', 'Consultar auditoria', 'Consultar histórico administrativo e alterações de configuração.')
on conflict (key) do update set label = excluded.label, description = excluded.description, active = true;

create or replace function public.audit_administrative_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  before_row jsonb;
  after_row jsonb;
  action_name text;
  record_id text;
begin
  before_row := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end;
  after_row := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(NEW) else null end;
  action_name := lower(TG_OP);
  record_id := coalesce(after_row ->> 'id', before_row ->> 'id', 'unknown');

  insert into public.audit_logs (actor_user_id, origin, entity_type, entity_id, action, old_values, new_values, request_summary)
  values (auth.uid(), 'ui', TG_TABLE_NAME, record_id, action_name, before_row, after_row, 'Alteração administrativa registrada automaticamente');

  return coalesce(NEW, OLD);
end;
$$;

revoke all on function public.audit_administrative_change() from public;

create or replace trigger audit_companies
  after insert or update or delete on public.companies
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_org_units
  after insert or update or delete on public.org_units
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_org_areas
  after insert or update or delete on public.org_areas
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_employees
  after insert or update or delete on public.employees
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_employee_assignments
  after insert or update or delete on public.employee_assignments
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_employee_relationships
  after insert or update or delete on public.employee_relationships
  for each row execute function public.audit_administrative_change();
create or replace trigger audit_user_permission_grants
  after insert or update or delete on public.user_permission_grants
  for each row execute function public.audit_administrative_change();
