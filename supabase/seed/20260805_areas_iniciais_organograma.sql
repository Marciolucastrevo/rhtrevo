-- RHTrevo: initial area hierarchy based on the current organization chart.
-- All records remain editable through the administrative panel.

-- Executive and corporate structure
insert into public.org_areas (name, code, active) values
  ('Direção Executiva', 'DIREX', true),
  ('Corporativo & Pessoas', 'CORP', true),
  ('Financeiro & Custos', 'FINC', true),
  ('Comercial & Suprimentos', 'COMS', true),
  ('Operações', 'OPER', true)
on conflict (name) do update set active = true;

-- Corporate & people
insert into public.org_areas (name, code, parent_area_id, active)
select 'Pessoas & RH', 'RH', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Departamento Pessoal', 'DP', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Jurídico', 'JUR', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Tecnologia da Informação', 'TI', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Compliance', 'COMP', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Auditoria', 'AUD', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'SGI & SSMA', 'SGI', id, true from public.org_areas where name = 'Corporativo & Pessoas'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;

-- Finance and commercial
insert into public.org_areas (name, code, parent_area_id, active)
select 'Financeiro', 'FIN', id, true from public.org_areas where name = 'Financeiro & Custos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Pagadoria', 'PAG', id, true from public.org_areas where name = 'Financeiro & Custos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Receita & Custos', 'REC', id, true from public.org_areas where name = 'Financeiro & Custos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Compras', 'COMPR', id, true from public.org_areas where name = 'Comercial & Suprimentos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Marketing', 'MKT', id, true from public.org_areas where name = 'Comercial & Suprimentos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Vendas', 'VEND', id, true from public.org_areas where name = 'Comercial & Suprimentos'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;

-- Operational areas
insert into public.org_areas (name, code, parent_area_id, active)
select 'Postos', 'POST', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'TRRs', 'TRR', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Transportes & Logística', 'TRANS', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Mecânica, Peças & Serviços', 'MEC', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Construção & Patrimônio', 'CONST', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Viva Ambiental', 'VIVA', id, true from public.org_areas where name = 'Operações'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;

-- Cross-functional domains for multi-company roles and driver workflows.
insert into public.org_areas (name, code, parent_area_id, active)
select 'Logística', 'LOG', id, true from public.org_areas where name = 'Transportes & Logística'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Frota & Manutenção', 'FROTA', id, true from public.org_areas where name = 'Transportes & Logística'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Abastecimento', 'ABAST', id, true from public.org_areas where name = 'Transportes & Logística'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
insert into public.org_areas (name, code, parent_area_id, active)
select 'Documentação de Transportes', 'DOCTRANS', id, true from public.org_areas where name = 'Transportes & Logística'
on conflict (name) do update set parent_area_id = excluded.parent_area_id, active = true;
