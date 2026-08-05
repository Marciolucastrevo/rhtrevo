import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type ConnectionState = 'checking' | 'ready' | 'unavailable'
type ModuleKey = 'home' | 'structure' | 'people' | 'organogram' | 'authorizations' | 'audit'
type RootRole = { role: string; active: boolean }
type Company = { id: string; name: string; legal_name: string | null; registration_number: string | null; active: boolean }
type Area = { id: string; name: string; code: string | null; active: boolean }
type Unit = { id: string; name: string; code: string | null; company_id: string; active: boolean }
type JobRole = { id: string; name: string; active: boolean }
type Team = { id: string; name: string; company_id: string | null; unit_id: string | null; area_id: string | null; active: boolean }
type Employee = { id: string; full_name: string; active: boolean }
type Assignment = { id: string; employee_id: string; kind: 'employment' | 'functional' | 'technical' | 'process' | 'portfolio' | 'temporary'; company_id: string | null; unit_id: string | null; area_id: string | null; job_role_id: string | null; is_primary: boolean; starts_at: string; ends_at: string | null; source_employee_code: string | null }
type Relationship = { id: string; subject_employee_id: string; related_employee_id: string; kind: string; starts_at: string; ends_at: string | null }

const foundations = [
  ['Estrutura organizacional', 'Empresas, unidades, áreas, equipes e cargos editáveis'],
  ['Vínculos e organograma', 'Relações formais, funcionais e responsabilidades por pessoa'],
  ['Acessos por usuário', 'Autonomias e dados sensíveis definidos por ação e escopo'],
  ['Auditoria e segurança', 'Histórico de mudanças e acesso negado por padrão'],
]

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(isSupabaseConfigured ? 'checking' : 'unavailable')
  const [session, setSession] = useState<Session | null>(null)
  const [roles, setRoles] = useState<RootRole[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeModule, setActiveModule] = useState<ModuleKey>('home')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [personQuery, setPersonQuery] = useState('')
  const [structureError, setStructureError] = useState<string | null>(null)
  const [structureLoading, setStructureLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data, error }) => {
      setSession(data.session)
      setConnectionState(error ? 'unavailable' : 'ready')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      setRoles([])
      return
    }
    void supabase.from('user_roles').select('role, active').eq('user_id', session.user.id).eq('active', true)
      .then(({ data }) => setRoles((data ?? []) as RootRole[]))
  }, [session])

  const isRootAdmin = roles.some((role) => role.role === 'root_admin')

  async function refreshStructure() {
    if (!supabase || !isRootAdmin) return
    setStructureLoading(true)
    setStructureError(null)
    const [companyResult, areaResult, unitResult, jobRoleResult, teamResult, employeeResult, assignmentResult, relationshipResult] = await Promise.all([
      supabase.from('companies').select('id, name, legal_name, registration_number, active').order('name'),
      supabase.from('org_areas').select('id, name, code, active').order('name'),
      supabase.from('org_units').select('id, name, code, company_id, active').order('name'),
      supabase.from('job_roles').select('id, name, active').order('name'),
      supabase.from('teams').select('id, name, company_id, unit_id, area_id, active').order('name'),
      supabase.from('employees').select('id, full_name, active').order('full_name'),
      supabase.from('employee_assignments').select('id, employee_id, kind, company_id, unit_id, area_id, job_role_id, is_primary, starts_at, ends_at, source_employee_code').order('starts_at', { ascending: false }),
      supabase.from('employee_relationships').select('id, subject_employee_id, related_employee_id, kind, starts_at, ends_at').order('starts_at', { ascending: false }),
    ])
    const error = companyResult.error ?? areaResult.error ?? unitResult.error ?? jobRoleResult.error ?? teamResult.error ?? employeeResult.error ?? assignmentResult.error ?? relationshipResult.error
    if (error) setStructureError('Não foi possível carregar os cadastros organizacionais.')
    setCompanies((companyResult.data ?? []) as Company[])
    setAreas((areaResult.data ?? []) as Area[])
    setUnits((unitResult.data ?? []) as Unit[])
    setJobRoles((jobRoleResult.data ?? []) as JobRole[])
    setTeams((teamResult.data ?? []) as Team[])
    const nextEmployees = (employeeResult.data ?? []) as Employee[]
    setEmployees(nextEmployees)
    setAssignments((assignmentResult.data ?? []) as Assignment[])
    setRelationships((relationshipResult.data ?? []) as Relationship[])
    if (!selectedEmployeeId && nextEmployees.length > 0) setSelectedEmployeeId(nextEmployees[0].id)
    setStructureLoading(false)
  }

  useEffect(() => { void refreshStructure() }, [isRootAdmin])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setAuthError(null)
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsSubmitting(false)
    if (error) setAuthError('Não foi possível entrar. Confira o e-mail e a senha.')
  }

  async function handleLogout() { await supabase?.auth.signOut() }

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('companies').insert({
      name: String(form.get('name')).trim(),
      legal_name: String(form.get('legal_name')).trim() || null,
      registration_number: String(form.get('registration_number')).trim() || null,
    })
    if (error) return setStructureError('Não foi possível criar a empresa. Verifique se o nome já existe.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function createArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('org_areas').insert({
      name: String(form.get('name')).trim(),
      code: String(form.get('code')).trim() || null,
      parent_area_id: String(form.get('parent_area_id')) || null,
    })
    if (error) return setStructureError('Não foi possível criar a área. Verifique se o nome já existe.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function createJobRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('job_roles').insert({ name: String(form.get('name')).trim(), cbo_code: String(form.get('cbo_code')).trim() || null })
    if (error) return setStructureError('Não foi possível criar o cargo.')
    event.currentTarget.reset(); void refreshStructure()
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('teams').insert({ name: String(form.get('name')).trim(), company_id: String(form.get('company_id')) || null, unit_id: String(form.get('unit_id')) || null, area_id: String(form.get('area_id')) || null })
    if (error) return setStructureError('Não foi possível criar a equipe.')
    event.currentTarget.reset(); void refreshStructure()
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('org_units').insert({
      company_id: String(form.get('company_id')),
      name: String(form.get('name')).trim(),
      code: String(form.get('code')).trim() || null,
      parent_unit_id: String(form.get('parent_unit_id')) || null,
    })
    if (error) return setStructureError('Não foi possível criar a unidade. Selecione uma empresa e confira o nome.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function rename(table: 'companies' | 'org_areas' | 'org_units' | 'job_roles' | 'teams', id: string, currentName: string) {
    if (!supabase) return
    const name = window.prompt('Novo nome:', currentName)?.trim()
    if (!name || name === currentName) return
    const { error } = await supabase.from(table).update({ name }).eq('id', id)
    if (error) return setStructureError('Não foi possível atualizar o cadastro.')
    void refreshStructure()
  }

  async function toggleActive(table: 'companies' | 'org_areas' | 'org_units' | 'job_roles' | 'teams', id: string, active: boolean) {
    if (!supabase) return
    const { error } = await supabase.from(table).update({ active: !active }).eq('id', id)
    if (error) return setStructureError('Não foi possível atualizar o status do cadastro.')
    void refreshStructure()
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !selectedEmployeeId) return
    const form = new FormData(event.currentTarget)
    const isPrimary = form.get('is_primary') === 'on'
    if (isPrimary) {
      const { error } = await supabase.from('employee_assignments').update({ is_primary: false }).eq('employee_id', selectedEmployeeId).is('ends_at', null)
      if (error) return setStructureError('Não foi possível atualizar o vínculo principal atual.')
    }
    const { error } = await supabase.from('employee_assignments').insert({
      employee_id: selectedEmployeeId,
      kind: String(form.get('kind')),
      company_id: String(form.get('company_id')) || null,
      unit_id: String(form.get('unit_id')) || null,
      area_id: String(form.get('area_id')) || null,
      job_role_id: String(form.get('job_role_id')) || null,
      starts_at: String(form.get('starts_at')),
      is_primary: isPrimary,
      notes: String(form.get('notes')).trim() || null,
    })
    if (error) return setStructureError('Não foi possível criar o vínculo. Confira empresa, área, função e vigência.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function createRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !selectedEmployeeId) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('employee_relationships').insert({ subject_employee_id: selectedEmployeeId, related_employee_id: String(form.get('related_employee_id')), kind: String(form.get('kind')), starts_at: String(form.get('starts_at')) })
    if (error) return setStructureError('Não foi possível criar a relação organizacional.')
    event.currentTarget.reset(); void refreshStructure()
  }

  async function setPrimaryAssignment(assignment: Assignment) {
    if (!supabase) return
    const { error: clearError } = await supabase.from('employee_assignments').update({ is_primary: false }).eq('employee_id', assignment.employee_id).is('ends_at', null)
    if (clearError) return setStructureError('Não foi possível alterar o vínculo principal.')
    const { error } = await supabase.from('employee_assignments').update({ is_primary: true }).eq('id', assignment.id)
    if (error) return setStructureError('Não foi possível definir o vínculo principal.')
    void refreshStructure()
  }

  async function endAssignment(assignment: Assignment) {
    if (!supabase || !window.confirm('Encerrar este vínculo hoje? O histórico será preservado.')) return
    const { error } = await supabase.from('employee_assignments').update({ ends_at: new Date().toISOString().slice(0, 10), is_primary: false }).eq('id', assignment.id)
    if (error) return setStructureError('Não foi possível encerrar o vínculo.')
    void refreshStructure()
  }

  if (!isSupabaseConfigured) return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">RHTrevo</p><h1>Configuração pendente</h1><p>Informe a URL e a chave publicável do Supabase no ambiente local para iniciar.</p></section></main>

  if (!session) {
    return <main className="auth-shell"><form className="auth-card" onSubmit={handleLogin}><p className="eyebrow">Grupo Trevo</p><h1>Acesso privado</h1><p>Entre com a conta administrativa criada para o ambiente de desenvolvimento.</p><label>E-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{authError && <p className="form-error">{authError}</p>}<button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button></form></main>
  }

  const visibleEmployees = employees.filter((employee) => employee.full_name.toLocaleLowerCase().includes(personQuery.toLocaleLowerCase()))
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId)
  const selectedAssignments = assignments.filter((assignment) => assignment.employee_id === selectedEmployeeId)

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Grupo Trevo</p><h1>RHTrevo</h1></div><div className="header-actions"><span className={`status status-${connectionState}`}>{connectionState === 'checking' && 'Verificando ambiente'}{connectionState === 'ready' && 'Ambiente de desenvolvimento conectado'}{connectionState === 'unavailable' && 'Configuração pendente'}</span><button className="text-button" type="button" onClick={handleLogout}>Sair</button></div></header>
    <section className="hero" aria-labelledby="page-title"><p className="eyebrow">Fundação administrativa</p><h2 id="page-title">Plataforma privada em preparação</h2><p>A primeira entrega estabelece a estrutura organizacional, os vínculos entre pessoas e as permissões configuráveis por usuário — antes da migração de qualquer dado real.</p></section>
    <section className="admin-state" aria-label="Estado do acesso atual"><div><p className="eyebrow">Usuário autenticado</p><strong>{session.user.email}</strong><p>{isRootAdmin ? 'Administrador raiz ativo' : 'Acesso sem papel administrativo ativo'}</p></div><span className={isRootAdmin ? 'private-badge' : 'warning-badge'}>{isRootAdmin ? 'root_admin' : 'Revisar acesso'}</span></section>
    {isRootAdmin && <nav className="module-nav" aria-label="Módulos da plataforma">{([{ key: 'home', label: 'Visão geral' }, { key: 'structure', label: 'Estrutura' }, { key: 'people', label: 'Pessoas & vínculos' }, { key: 'organogram', label: 'Organograma' }, { key: 'authorizations', label: 'Autorizações' }, { key: 'audit', label: 'Auditoria' }] as Array<{ key: ModuleKey; label: string }>).map((module) => <button className={activeModule === module.key ? 'module-active' : ''} type="button" key={module.key} onClick={() => setActiveModule(module.key)}>{module.label}</button>)}</nav>}
    {isRootAdmin && activeModule === 'structure' && <section className="structure-section"><div className="section-heading"><div><p className="eyebrow">Configuração organizacional</p><h2>Empresas, unidades e áreas</h2><p>Cadastros vivos para refletir mudanças da operação sem depender de código.</p></div><button className="outline-button" type="button" onClick={() => void refreshStructure()} disabled={structureLoading}>{structureLoading ? 'Atualizando…' : 'Atualizar'}</button></div>{structureError && <p className="form-error">{structureError}</p>}<div className="structure-grid"><article className="structure-card"><h3>Empresas</h3><form onSubmit={createCompany}><input name="name" placeholder="Nome da empresa" required /><input name="legal_name" placeholder="Razão social (opcional)" /><input name="registration_number" placeholder="CNPJ (opcional)" /><button type="submit">Adicionar empresa</button></form><RecordList records={companies} onRename={(item) => void rename('companies', item.id, item.name)} onToggle={(item) => void toggleActive('companies', item.id, item.active)} /></article><article className="structure-card"><h3>Áreas</h3><form onSubmit={createArea}><input name="name" placeholder="Nome da área" required /><input name="code" placeholder="Sigla (opcional)" /><select name="parent_area_id" defaultValue=""><option value="">Área principal (opcional)</option>{areas.filter((area) => area.active).map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select><button type="submit">Adicionar área</button></form><RecordList records={areas} onRename={(item) => void rename('org_areas', item.id, item.name)} onToggle={(item) => void toggleActive('org_areas', item.id, item.active)} /></article><article className="structure-card"><h3>Unidades</h3><form onSubmit={createUnit}><select name="company_id" required defaultValue=""><option value="" disabled>Selecione a empresa</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><input name="name" placeholder="Nome da unidade" required /><input name="code" placeholder="Código (opcional)" /><select name="parent_unit_id" defaultValue=""><option value="">Unidade principal (opcional)</option>{units.filter((unit) => unit.active).map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select><button type="submit" disabled={!companies.some((company) => company.active)}>Adicionar unidade</button></form><RecordList records={units.map((unit) => ({ ...unit, detail: companies.find((company) => company.id === unit.company_id)?.name ?? 'Empresa não encontrada' }))} onRename={(item) => void rename('org_units', item.id, item.name)} onToggle={(item) => void toggleActive('org_units', item.id, item.active)} /></article><article className="structure-card"><h3>Cargos</h3><form onSubmit={createJobRole}><input name="name" placeholder="Nome do cargo" required /><input name="cbo_code" placeholder="Código CBO (opcional)" /><button type="submit">Adicionar cargo</button></form><RecordList records={jobRoles} onRename={(item) => void rename('job_roles', item.id, item.name)} onToggle={(item) => void toggleActive('job_roles', item.id, item.active)} /></article><article className="structure-card"><h3>Equipes</h3><form onSubmit={createTeam}><input name="name" placeholder="Nome da equipe" required /><select name="company_id" defaultValue=""><option value="">Empresa (opcional)</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><select name="area_id" defaultValue=""><option value="">Área (opcional)</option>{areas.filter((area) => area.active).map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select><button type="submit">Adicionar equipe</button></form><RecordList records={teams.map((team) => ({ ...team, detail: areas.find((area) => area.id === team.area_id)?.name ?? companies.find((company) => company.id === team.company_id)?.name ?? 'Sem escopo definido' }))} onRename={(item) => void rename('teams', item.id, item.name)} onToggle={(item) => void toggleActive('teams', item.id, item.active)} /></article></div></section>}
    {isRootAdmin && activeModule === 'people' && <section className="people-section"><div className="section-heading"><div><p className="eyebrow">Pessoas e vínculos</p><h2>Perfil organizacional</h2><p>Defina a empresa de registro e as atuações adicionais de cada pessoa, com histórico preservado.</p></div></div><div className="people-layout"><aside className="people-list"><label>Localizar pessoa<input value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} placeholder="Nome do colaborador" /></label><p>{visibleEmployees.length} pessoas encontradas</p><div>{visibleEmployees.map((employee) => <button className={employee.id === selectedEmployeeId ? 'person-selected' : ''} key={employee.id} type="button" onClick={() => setSelectedEmployeeId(employee.id)}>{employee.full_name}</button>)}</div></aside><article className="assignment-card">{selectedEmployee ? <><div className="person-title"><div><p className="eyebrow">Cadastro selecionado</p><h3>{selectedEmployee.full_name}</h3></div><span className={selectedEmployee.active ? 'record-active' : 'record-inactive'}>{selectedEmployee.active ? 'Ativo' : 'Inativo'}</span></div><h4>Vínculos atuais e históricos</h4><div className="assignment-list">{selectedAssignments.length === 0 && <p className="empty-state">Nenhum vínculo registrado.</p>}{selectedAssignments.map((assignment) => <div className="assignment-row" key={assignment.id}><div><strong>{companies.find((company) => company.id === assignment.company_id)?.name ?? 'Sem empresa'}</strong><small>{jobRoles.find((role) => role.id === assignment.job_role_id)?.name ?? 'Sem função'} · {areas.find((area) => area.id === assignment.area_id)?.name ?? 'Sem área'} · {assignment.kind}</small><small>{assignment.starts_at}{assignment.ends_at ? ` até ${assignment.ends_at}` : ' · vigente'}{assignment.source_employee_code ? ` · matrícula ERP ${assignment.source_employee_code}` : ''}</small></div><div className="record-actions">{assignment.is_primary ? <span className="record-active">Registro principal</span> : !assignment.ends_at && <button type="button" onClick={() => void setPrimaryAssignment(assignment)}>Definir principal</button>}{!assignment.ends_at && <button type="button" onClick={() => void endAssignment(assignment)}>Encerrar</button>}</div></div>)}</div><h4>Novo vínculo</h4><form className="assignment-form" onSubmit={createAssignment}><select name="kind" defaultValue="functional"><option value="employment">Registro empregatício</option><option value="functional">Atuação funcional</option><option value="technical">Responsabilidade técnica</option><option value="process">Responsável por processo</option><option value="portfolio">Carteira</option><option value="temporary">Atuação temporária</option></select><select name="company_id" required defaultValue=""><option value="" disabled>Empresa</option>{companies.filter((company) => company.active).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><select name="unit_id" defaultValue=""><option value="">Unidade (opcional)</option>{units.filter((unit) => unit.active).map((unit) => <option key={unit.id} value={unit.id}>{companies.find((company) => company.id === unit.company_id)?.name} — {unit.name}</option>)}</select><select name="area_id" defaultValue=""><option value="">Área (opcional)</option>{areas.filter((area) => area.active).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select><select name="job_role_id" defaultValue=""><option value="">Função/cargo (opcional)</option>{jobRoles.filter((role) => role.active).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><label>Início<input name="starts_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="checkbox-label"><input name="is_primary" type="checkbox" /> Empresa de registro principal</label><textarea name="notes" placeholder="Observação (opcional)" /><button type="submit">Adicionar vínculo</button></form><h4>Relações organizacionais</h4><form className="assignment-form" onSubmit={createRelationship}><select name="kind" defaultValue="direct_manager"><option value="direct_manager">Gestor direto</option><option value="secondary_manager">Gestor secundário</option><option value="functional_owner">Responsável funcional</option><option value="technical_owner">Responsável técnico</option><option value="approver">Aprovador</option><option value="mentor">Mentor</option><option value="delegate">Delegado</option></select><select name="related_employee_id" required defaultValue=""><option value="" disabled>Selecione a pessoa relacionada</option>{employees.filter((employee) => employee.id !== selectedEmployeeId && employee.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select><label>Início<input name="starts_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><button type="submit">Adicionar relação</button></form><div className="assignment-list">{relationships.filter((relationship) => relationship.subject_employee_id === selectedEmployeeId).map((relationship) => <div className="assignment-row" key={relationship.id}><div><strong>{employees.find((employee) => employee.id === relationship.related_employee_id)?.full_name ?? 'Pessoa não encontrada'}</strong><small>{relationship.kind} · {relationship.starts_at}{relationship.ends_at ? ` até ${relationship.ends_at}` : ' · vigente'}</small></div></div>)}</div></> : <p className="empty-state">Selecione uma pessoa para administrar seus vínculos.</p>}</article></div></section>}
    {activeModule === 'home' && <section className="foundation-grid" aria-label="Fundamentos da primeira entrega">{foundations.map(([title, description], index) => <article className="foundation-card" key={title}><span className="card-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>}
    {isRootAdmin && activeModule === 'organogram' && <Organogram companies={companies} units={units} areas={areas} employees={employees} assignments={assignments} relationships={relationships} />}
    {isRootAdmin && activeModule === 'authorizations' && <ModuleComingSoon title="Autorizações" description="Permissões explícitas por usuário, ação, escopo, classificação de dado e vigência." />}
    {isRootAdmin && activeModule === 'audit' && <ModuleComingSoon title="Auditoria" description="Histórico administrativo e linha do tempo das alterações da plataforma." />}
  </main>
}

function Organogram({ companies, units, areas, employees, assignments, relationships }: { companies: Company[]; units: Unit[]; areas: Area[]; employees: Employee[]; assignments: Assignment[]; relationships: Relationship[] }) {
  return <section className="organogram-section"><div className="section-heading"><div><p className="eyebrow">Organograma operacional</p><h2>Estrutura e vínculos</h2><p>Leitura da base atual sem alterar cadastros ou relações.</p></div></div><div className="organogram-grid">{companies.filter((company) => company.active).map((company) => { const companyAssignments = assignments.filter((assignment) => assignment.company_id === company.id && !assignment.ends_at); const companyUnits = units.filter((unit) => unit.company_id === company.id && unit.active); return <article className="organogram-company" key={company.id}><h3>{company.name}</h3><small>{companyAssignments.length} vínculos ativos · {companyUnits.length} unidades</small>{companyUnits.map((unit) => <div className="organogram-unit" key={unit.id}><strong>{unit.name}</strong><span>{companyAssignments.filter((assignment) => assignment.unit_id === unit.id).length} pessoas</span></div>)}</article>})}</div><p className="organogram-note">{areas.filter((area) => area.active).length} áreas · {employees.filter((employee) => employee.active).length} pessoas · {relationships.filter((relationship) => !relationship.ends_at).length} relações organizacionais vigentes</p></section>
}

function ModuleComingSoon({ title, description }: { title: string; description: string }) {
  return <section className="module-placeholder"><p className="eyebrow">Módulo em construção</p><h2>{title}</h2><p>{description}</p><span>Base de dados e regras transversais em preparação.</span></section>
}

function RecordList({ records, onRename, onToggle }: { records: Array<{ id: string; name: string; active: boolean; detail?: string }>; onRename: (record: { id: string; name: string; active: boolean }) => void; onToggle: (record: { id: string; name: string; active: boolean }) => void }) {
  if (records.length === 0) return <p className="empty-state">Nenhum cadastro criado ainda.</p>
  return <ul className="record-list">{records.map((record) => <li key={record.id}><div><strong>{record.name}</strong>{record.detail && <small>{record.detail}</small>}</div><div className="record-actions"><span className={record.active ? 'record-active' : 'record-inactive'}>{record.active ? 'Ativo' : 'Inativo'}</span><button type="button" onClick={() => onRename(record)}>Editar</button><button type="button" onClick={() => onToggle(record)}>{record.active ? 'Inativar' : 'Ativar'}</button></div></li>)}</ul>
}

export default App
