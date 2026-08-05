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
    const [companyResult, areaResult, unitResult] = await Promise.all([
      supabase.from('companies').select('id, name, legal_name, registration_number, active').order('name'),
      supabase.from('org_areas').select('id, name, code, active').order('name'),
      supabase.from('org_units').select('id, name, code, company_id, active').order('name'),
    ])
    const error = companyResult.error ?? areaResult.error ?? unitResult.error
    if (error) setStructureError('Não foi possível carregar os cadastros organizacionais.')
    setCompanies((companyResult.data ?? []) as Company[])
    setAreas((areaResult.data ?? []) as Area[])
    setUnits((unitResult.data ?? []) as Unit[])
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

  if (!isSupabaseConfigured) return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">RHTrevo</p><h1>Configuração pendente</h1><p>Informe a URL e a chave publicável do Supabase no ambiente local para iniciar.</p></section></main>

  if (!session) {
    return <main className="auth-shell"><form className="auth-card" onSubmit={handleLogin}><p className="eyebrow">Grupo Trevo</p><h1>Acesso privado</h1><p>Entre com a conta administrativa criada para o ambiente de desenvolvimento.</p><label>E-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{authError && <p className="form-error">{authError}</p>}<button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button></form></main>
  }

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Grupo Trevo</p><h1>RHTrevo</h1></div><div className="header-actions"><span className={`status status-${connectionState}`}>{connectionState === 'checking' && 'Verificando ambiente'}{connectionState === 'ready' && 'Ambiente de desenvolvimento conectado'}{connectionState === 'unavailable' && 'Configuração pendente'}</span><button className="text-button" type="button" onClick={handleLogout}>Sair</button></div></header>
    <section className="hero" aria-labelledby="page-title"><p className="eyebrow">Fundação administrativa</p><h2 id="page-title">Plataforma privada em preparação</h2><p>A primeira entrega estabelece a estrutura organizacional, os vínculos entre pessoas e as permissões configuráveis por usuário — antes da migração de qualquer dado real.</p></section>
    <section className="admin-state" aria-label="Estado do acesso atual"><div><p className="eyebrow">Usuário autenticado</p><strong>{session.user.email}</strong><p>{isRootAdmin ? 'Administrador raiz ativo' : 'Acesso sem papel administrativo ativo'}</p></div><span className={isRootAdmin ? 'private-badge' : 'warning-badge'}>{isRootAdmin ? 'root_admin' : 'Revisar acesso'}</span></section>
    {isRootAdmin && <section className="structure-section"><div className="section-heading"><div><p className="eyebrow">Configuração organizacional</p><h2>Empresas, unidades e áreas</h2><p>Cadastros vivos para refletir mudanças da operação sem depender de código.</p></div><button className="outline-button" type="button" onClick={() => void refreshStructure()} disabled={structureLoading}>{structureLoading ? 'Atualizando…' : 'Atualizar'}</button></div>{structureError && <p className="form-error">{structureError}</p>}<div className="structure-grid"><article className="structure-card"><h3>Empresas</h3><form onSubmit={createCompany}><input name="name" placeholder="Nome da empresa" required /><input name="legal_name" placeholder="Razão social (opcional)" /><input name="registration_number" placeholder="CNPJ (opcional)" /><button type="submit">Adicionar empresa</button></form><RecordList records={companies} onRename={(item) => void rename('companies', item.id, item.name)} onToggle={(item) => void toggleActive('companies', item.id, item.active)} /></article><article className="structure-card"><h3>Áreas</h3><form onSubmit={createArea}><input name="name" placeholder="Nome da área" required /><input name="code" placeholder="Sigla (opcional)" /><button type="submit">Adicionar área</button></form><RecordList records={areas} onRename={(item) => void rename('org_areas', item.id, item.name)} onToggle={(item) => void toggleActive('org_areas', item.id, item.active)} /></article><article className="structure-card"><h3>Unidades</h3><form onSubmit={createUnit}><select name="company_id" required defaultValue=""><option value="" disabled>Selecione a empresa</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><input name="name" placeholder="Nome da unidade" required /><input name="code" placeholder="Código (opcional)" /><button type="submit" disabled={!companies.some((company) => company.active)}>Adicionar unidade</button></form><RecordList records={units.map((unit) => ({ ...unit, detail: companies.find((company) => company.id === unit.company_id)?.name ?? 'Empresa não encontrada' }))} onRename={(item) => void rename('org_units', item.id, item.name)} onToggle={(item) => void toggleActive('org_units', item.id, item.active)} /></article></div></section>}
    <section className="foundation-grid" aria-label="Fundamentos da primeira entrega">{foundations.map(([title, description], index) => <article className="foundation-card" key={title}><span className="card-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>
  </main>
}

function RecordList({ records, onRename, onToggle }: { records: Array<{ id: string; name: string; active: boolean; detail?: string }>; onRename: (record: { id: string; name: string; active: boolean }) => void; onToggle: (record: { id: string; name: string; active: boolean }) => void }) {
  if (records.length === 0) return <p className="empty-state">Nenhum cadastro criado ainda.</p>
  return <ul className="record-list">{records.map((record) => <li key={record.id}><div><strong>{record.name}</strong>{record.detail && <small>{record.detail}</small>}</div><div className="record-actions"><span className={record.active ? 'record-active' : 'record-inactive'}>{record.active ? 'Ativo' : 'Inativo'}</span><button type="button" onClick={() => onRename(record)}>Editar</button><button type="button" onClick={() => onToggle(record)}>{record.active ? 'Inativar' : 'Ativar'}</button></div></li>)}</ul>
}

export default App
