import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type ConnectionState = 'checking' | 'ready' | 'unavailable'
type RootRole = { role: string; active: boolean }
type Company = { id: string; name: string; legal_name: string | null; registration_number: string | null; active: boolean }
type Area = { id: string; name: string; code: string | null; active: boolean }
type Unit = { id: string; name: string; code: string | null; company_id: string; active: boolean }
type JobRole = { id: string; name: string; active: boolean }
type Employee = { id: string; full_name: string; active: boolean }
type Assignment = { id: string; employee_id: string; kind: 'employment' | 'functional' | 'technical' | 'process' | 'portfolio' | 'temporary'; company_id: string | null; unit_id: string | null; area_id: string | null; job_role_id: string | null; is_primary: boolean; starts_at: string; ends_at: string | null; source_employee_code: string | null }

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
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
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
    const [companyResult, areaResult, unitResult, jobRoleResult, employeeResult, assignmentResult] = await Promise.all([
      supabase.from('companies').select('id, name, legal_name, registration_number, active').order('name'),
      supabase.from('org_areas').select('id, name, code, active').order('name'),
      supabase.from('org_units').select('id, name, code, company_id, active').order('name'),
      supabase.from('job_roles').select('id, name, active').order('name'),
      supabase.from('employees').select('id, full_name, active').order('full_name'),
      supabase.from('employee_assignments').select('id, employee_id, kind, company_id, unit_id, area_id, job_role_id, is_primary, starts_at, ends_at, source_employee_code').order('starts_at', { ascending: false }),
    ])
    const error = companyResult.error ?? areaResult.error ?? unitResult.error ?? jobRoleResult.error ?? employeeResult.error ?? assignmentResult.error
    if (error) setStructureError('Não foi possível carregar os cadastros organizacionais.')
    setCompanies((companyResult.data ?? []) as Company[])
    setAreas((areaResult.data ?? []) as Area[])
    setUnits((unitResult.data ?? []) as Unit[])
    setJobRoles((jobRoleResult.data ?? []) as JobRole[])
    const nextEmployees = (employeeResult.data ?? []) as Employee[]
    setEmployees(nextEmployees)
    setAssignments((assignmentResult.data ?? []) as Assignment[])
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
    })
    if (error) return setStructureError('Não foi possível criar a área. Verifique se o nome já existe.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('org_units').insert({
      company_id: String(form.get('company_id')),
      name: String(form.get('name')).trim(),
      code: String(form.get('code')).trim() || null,
    })
    if (error) return setStructureError('Não foi possível criar a unidade. Selecione uma empresa e confira o nome.')
    event.currentTarget.reset()
    void refreshStructure()
  }

  async function rename(table: 'companies' | 'org_areas' | 'org_units', id: string, currentName: string) {
    if (!supabase) return
    const name = window.prompt('Novo nome:', currentName)?.trim()
    if (!name || name === currentName) return
    const { error } = await supabase.from(table).update({ name }).eq('id', id)
    if (error) return setStructureError('Não foi possível atualizar o cadastro.')
    void refreshStructure()
  }

  async function toggleActive(table: 'companies' | 'org_areas' | 'org_units', id: string, active: boolean) {
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
    {isRootAdmin && <section className="structure-section"><div className="section-heading"><div><p className="eyebrow">Configuração organizacional</p><h2>Empresas, unidades e áreas</h2><p>Cadastros vivos para refletir mudanças da operação sem depender de código.</p></div><button className="outline-button" type="button" onClick={() => void refreshStructure()} disabled={structureLoading}>{structureLoading ? 'Atualizando…' : 'Atualizar'}</button></div>{structureError && <p className="form-error">{structureError}</p>}<div className="structure-grid"><article className="structure-card"><h3>Empresas</h3><form onSubmit={createCompany}><input name="name" placeholder="Nome da empresa" required /><input name="legal_name" placeholder="Razão social (opcional)" /><input name="registration_number" placeholder="CNPJ (opcional)" /><button type="submit">Adicionar empresa</button></form><RecordList records={companies} onRename={(item) => void rename('companies', item.id, item.name)} onToggle={(item) => void toggleActive('companies', item.id, item.active)} /></article><article className="structure-card"><h3>Áreas</h3><form onSubmit={createArea}><input name="name" placeholder="Nome da área" required /><input name="code" placeholder="Sigla (opcional)" /><button type="submit">Adicionar área</button></form><RecordList records={areas} onRename={(item) => void rename('org_areas', item.id, item.name)} onToggle={(item) => void toggleActive('org_areas', item.id, item.active)} /></article><article className="structure-card"><h3>Unidades</h3><form onSubmit={createUnit}><select name="company_id" required defaultValue=""><option value="" disabled>Selecione a empresa</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><input name="name" placeholder="Nome da unidade" required /><input name="code" placeholder="Código (opcional)" /><button type="submit" disabled={!companies.some((company) => company.active)}>Adicionar unidade</button></form><RecordList records={units.map((unit) => ({ ...unit, detail: companies.find((company) => company.id === unit.company_id)?.name ?? 'Empresa não encontrada' }))} onRename={(item) => void rename('org_units', item.id, item.name)} onToggle={(item) => void toggleActive('org_units', item.id, item.active)} /></article></div></section>}
    {isRootAdmin && <section className="people-section"><div className="section-heading"><div><p className="eyebrow">Pessoas e vínculos</p><h2>Perfil organizacional</h2><p>Defina a empresa de registro e as atuações adicionais de cada pessoa, com histórico preservado.</p></div></div><div className="people-layout"><aside className="people-list"><label>Localizar pessoa<input value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} placeholder="Nome do colaborador" /></label><p>{visibleEmployees.length} pessoas encontradas</p><div>{visibleEmployees.map((employee) => <button className={employee.id === selectedEmployeeId ? 'person-selected' : ''} key={employee.id} type="button" onClick={() => setSelectedEmployeeId(employee.id)}>{employee.full_name}</button>)}</div></aside><article className="assignment-card">{selectedEmployee ? <><div className="person-title"><div><p className="eyebrow">Cadastro selecionado</p><h3>{selectedEmployee.full_name}</h3></div><span className={selectedEmployee.active ? 'record-active' : 'record-inactive'}>{selectedEmployee.active ? 'Ativo' : 'Inativo'}</span></div><h4>Vínculos atuais e históricos</h4><div className="assignment-list">{selectedAssignments.length === 0 && <p className="empty-state">Nenhum vínculo registrado.</p>}{selectedAssignments.map((assignment) => <div className="assignment-row" key={assignment.id}><div><strong>{companies.find((company) => company.id === assignment.company_id)?.name ?? 'Sem empresa'}</strong><small>{jobRoles.find((role) => role.id === assignment.job_role_id)?.name ?? 'Sem função'} · {areas.find((area) => area.id === assignment.area_id)?.name ?? 'Sem área'} · {assignment.kind}</small><small>{assignment.starts_at}{assignment.ends_at ? ` até ${assignment.ends_at}` : ' · vigente'}{assignment.source_employee_code ? ` · matrícula ERP ${assignment.source_employee_code}` : ''}</small></div><div className="record-actions">{assignment.is_primary ? <span className="record-active">Registro principal</span> : !assignment.ends_at && <button type="button" onClick={() => void setPrimaryAssignment(assignment)}>Definir principal</button>}{!assignment.ends_at && <button type="button" onClick={() => void endAssignment(assignment)}>Encerrar</button>}</div></div>)}</div><h4>Novo vínculo</h4><form className="assignment-form" onSubmit={createAssignment}><select name="kind" defaultValue="functional"><option value="employment">Registro empregatício</option><option value="functional">Atuação funcional</option><option value="technical">Responsabilidade técnica</option><option value="process">Responsável por processo</option><option value="portfolio">Carteira</option><option value="temporary">Atuação temporária</option></select><select name="company_id" required defaultValue=""><option value="" disabled>Empresa</option>{companies.filter((company) => company.active).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><select name="unit_id" defaultValue=""><option value="">Unidade (opcional)</option>{units.filter((unit) => unit.active).map((unit) => <option key={unit.id} value={unit.id}>{companies.find((company) => company.id === unit.company_id)?.name} — {unit.name}</option>)}</select><select name="area_id" defaultValue=""><option value="">Área (opcional)</option>{areas.filter((area) => area.active).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select><select name="job_role_id" defaultValue=""><option value="">Função/cargo (opcional)</option>{jobRoles.filter((role) => role.active).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><label>Início<input name="starts_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="checkbox-label"><input name="is_primary" type="checkbox" /> Empresa de registro principal</label><textarea name="notes" placeholder="Observação (opcional)" /><button type="submit">Adicionar vínculo</button></form></> : <p className="empty-state">Selecione uma pessoa para administrar seus vínculos.</p>}</article></div></section>}
    <section className="foundation-grid" aria-label="Fundamentos da primeira entrega">{foundations.map(([title, description], index) => <article className="foundation-card" key={title}><span className="card-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>
  </main>
}

function RecordList({ records, onRename, onToggle }: { records: Array<{ id: string; name: string; active: boolean; detail?: string }>; onRename: (record: { id: string; name: string; active: boolean }) => void; onToggle: (record: { id: string; name: string; active: boolean }) => void }) {
  if (records.length === 0) return <p className="empty-state">Nenhum cadastro criado ainda.</p>
  return <ul className="record-list">{records.map((record) => <li key={record.id}><div><strong>{record.name}</strong>{record.detail && <small>{record.detail}</small>}</div><div className="record-actions"><span className={record.active ? 'record-active' : 'record-inactive'}>{record.active ? 'Ativo' : 'Inativo'}</span><button type="button" onClick={() => onRename(record)}>Editar</button><button type="button" onClick={() => onToggle(record)}>{record.active ? 'Inativar' : 'Ativar'}</button></div></li>)}</ul>
}

export default App
