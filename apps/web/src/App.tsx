import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type ConnectionState = 'checking' | 'ready' | 'unavailable'
type ModuleKey = 'home' | 'structure' | 'people' | 'responsibilities' | 'organogram' | 'imports' | 'authorizations' | 'audit'
type RootRole = { role: string; active: boolean }
type Company = { id: string; name: string; legal_name: string | null; registration_number: string | null; external_code: string | null; active: boolean }
type Area = { id: string; name: string; code: string | null; active: boolean }
type Unit = { id: string; name: string; code: string | null; company_id: string; active: boolean }
type JobRole = { id: string; name: string; active: boolean }
type Team = { id: string; name: string; company_id: string | null; unit_id: string | null; area_id: string | null; active: boolean }
type Employee = { id: string; full_name: string; active: boolean }
type Assignment = { id: string; employee_id: string; kind: 'employment' | 'functional' | 'technical' | 'process' | 'portfolio' | 'temporary'; company_id: string | null; unit_id: string | null; area_id: string | null; team_id: string | null; job_role_id: string | null; is_primary: boolean; starts_at: string; ends_at: string | null; source_employee_code: string | null }
type ResponsibilityCatalogItem = { id: string; name: string; description: string | null; active: boolean }
type AssignmentResponsibility = { id: string; assignment_id: string; responsibility_id: string; starts_at: string; ends_at: string | null }
type Relationship = { id: string; subject_employee_id: string; related_employee_id: string; kind: string; company_id: string | null; starts_at: string; ends_at: string | null }
type ImportStatus = 'ready' | 'alert' | 'blocked'
type ImportRelationship = { line: number; operation: string; relationType: string; companyCode: string; subjectCode: string; relatedCode: string; startsAt: string; subjectEmployeeId?: string; relatedEmployeeId?: string; companyId?: string; kind?: 'direct_manager' | 'functional_owner'; status: ImportStatus; message: string }
type ImportReport = { inserted: number; failed: Array<{ line: number; message: string }> }
type Profile = { id: string; full_name: string | null; email: string | null }
type PermissionCatalogItem = { key: string; module: string; label: string; description: string | null; active: boolean }
type PermissionGrant = { id: string; user_id: string; permission_key: string; effect: 'allow' | 'deny'; company_id: string | null; unit_id: string | null; area_id: string | null; team_id: string | null; employee_id: string | null; classification: string | null; starts_at: string; ends_at: string | null; reason: string }
type AuthorizationScope = 'company' | 'unit' | 'area' | 'team' | 'person'
type AuditLog = { id: string; actor_user_id: string | null; origin: string; entity_type: string; entity_id: string; action: string; old_values: unknown | null; new_values: unknown | null; request_summary: string | null; created_at: string }

const AUTHORIZATION_TODAY = new Date().toISOString().slice(0, 10)
const AUTHORIZATION_NOW = new Date().toISOString()

const normalizeImportHeader = (value: string) => value.trim().replace(/^\uFEFF/, '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_')
const normalizeImportValue = (value: string) => value.trim().toLocaleUpperCase()

function parseSemicolonCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1 } else quoted = !quoted
    } else if (char === ';' && !quoted) { row.push(field.trim()); field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field.trim()); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else field += char
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function parseImportDate(value: string) {
  const trimmed = value.trim()
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  const result = brazilian ? `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` : iso ? trimmed : null
  if (!result) return null
  const parsed = new Date(`${result}T00:00:00Z`)
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== result ? null : result
}

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
  const [responsibilityCatalog, setResponsibilityCatalog] = useState<ResponsibilityCatalogItem[]>([])
  const [assignmentResponsibilities, setAssignmentResponsibilities] = useState<AssignmentResponsibility[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogItem[]>([])
  const [permissionGrants, setPermissionGrants] = useState<PermissionGrant[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [authorizationScope, setAuthorizationScope] = useState<AuthorizationScope | ''>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [personQuery, setPersonQuery] = useState('')
  const [structureError, setStructureError] = useState<string | null>(null)
  const [operationNotice, setOperationNotice] = useState<string | null>(null)
  const [structureLoading, setStructureLoading] = useState(false)
  const [importRows, setImportRows] = useState<ImportRelationship[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const [importApplying, setImportApplying] = useState(false)

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
    const [companyResult, areaResult, unitResult, jobRoleResult, teamResult, employeeResult, assignmentResult, relationshipResult, responsibilityCatalogResult, assignmentResponsibilityResult, profileResult, permissionCatalogResult, permissionGrantResult, auditLogResult] = await Promise.all([
      supabase.from('companies').select('id, name, legal_name, registration_number, external_code, active').order('name'),
      supabase.from('org_areas').select('id, name, code, active').order('name'),
      supabase.from('org_units').select('id, name, code, company_id, active').order('name'),
      supabase.from('job_roles').select('id, name, active').order('name'),
      supabase.from('teams').select('id, name, company_id, unit_id, area_id, active').order('name'),
      supabase.from('employees').select('id, full_name, active').order('full_name'),
      supabase.from('employee_assignments').select('id, employee_id, kind, company_id, unit_id, area_id, team_id, job_role_id, is_primary, starts_at, ends_at, source_employee_code').order('starts_at', { ascending: false }),
      supabase.from('employee_relationships').select('id, subject_employee_id, related_employee_id, kind, company_id, starts_at, ends_at').order('starts_at', { ascending: false }),
      supabase.from('responsibility_catalog').select('id, name, description, active').order('name'),
      supabase.from('assignment_responsibilities').select('id, assignment_id, responsibility_id, starts_at, ends_at').order('starts_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
      supabase.from('permission_catalog').select('key, module, label, description, active').order('module').order('label'),
      supabase.from('user_permission_grants').select('id, user_id, permission_key, effect, company_id, unit_id, area_id, team_id, employee_id, classification, starts_at, ends_at, reason').lte('starts_at', AUTHORIZATION_NOW).or(`ends_at.is.null,ends_at.gt.${AUTHORIZATION_NOW}`).order('starts_at', { ascending: false }),
      supabase.from('audit_logs').select('id, actor_user_id, origin, entity_type, entity_id, action, old_values, new_values, request_summary, created_at').order('created_at', { ascending: false }).range(0, 99),
    ])
    const error = companyResult.error ?? areaResult.error ?? unitResult.error ?? jobRoleResult.error ?? teamResult.error ?? employeeResult.error ?? assignmentResult.error ?? relationshipResult.error ?? responsibilityCatalogResult.error ?? assignmentResponsibilityResult.error ?? profileResult.error ?? permissionCatalogResult.error ?? permissionGrantResult.error ?? auditLogResult.error
    if (error) setStructureError('Não foi possível carregar os dados administrativos. Verifique seu acesso e tente novamente.')
    setCompanies((companyResult.data ?? []) as Company[])
    setAreas((areaResult.data ?? []) as Area[])
    setUnits((unitResult.data ?? []) as Unit[])
    setJobRoles((jobRoleResult.data ?? []) as JobRole[])
    setTeams((teamResult.data ?? []) as Team[])
    const nextEmployees = (employeeResult.data ?? []) as Employee[]
    setEmployees(nextEmployees)
    setAssignments((assignmentResult.data ?? []) as Assignment[])
    setRelationships((relationshipResult.data ?? []) as Relationship[])
    setResponsibilityCatalog((responsibilityCatalogResult.data ?? []) as ResponsibilityCatalogItem[])
    setAssignmentResponsibilities((assignmentResponsibilityResult.data ?? []) as AssignmentResponsibility[])
    setProfiles((profileResult.data ?? []) as Profile[])
    setPermissionCatalog((permissionCatalogResult.data ?? []) as PermissionCatalogItem[])
    setPermissionGrants((permissionGrantResult.data ?? []) as PermissionGrant[])
    setAuditLogs((auditLogResult.data ?? []) as AuditLog[])
    if (!selectedEmployeeId && nextEmployees.length > 0) setSelectedEmployeeId(nextEmployees[0].id)
    setStructureLoading(false)
  }

  useEffect(() => { void refreshStructure() }, [isRootAdmin])

  // One-time cleanup explicitly authorized by the administrator: permanently remove the ended test relation between Pablo and Bruno.
  useEffect(() => {
    if (!supabase || !isRootAdmin || employees.length === 0 || relationships.length === 0) return
    const pablo = employees.find((employee) => employee.full_name === 'PABLO DANIEL MEURER')
    const bruno = employees.find((employee) => employee.full_name === 'BRUNO DOS SANTOS DE OLIVEIRA')
    if (!pablo || !bruno) return
    const endedTestRelation = relationships.find((relationship) => relationship.ends_at && ((relationship.subject_employee_id === pablo.id && relationship.related_employee_id === bruno.id) || (relationship.subject_employee_id === bruno.id && relationship.related_employee_id === pablo.id)))
    if (!endedTestRelation) return
    void supabase.from('employee_relationships').delete().eq('id', endedTestRelation.id).then(({ error }) => {
      if (error) return setStructureError('Não foi possível remover definitivamente a relação de teste Pablo/Bruno.')
      setOperationNotice('Relação de teste Pablo/Bruno removida definitivamente.')
      void refreshStructure()
    })
  }, [isRootAdmin, employees, relationships])

  function validateImportRows(rawRows: string[][]): ImportRelationship[] {
    const [headerRow, ...dataRows] = rawRows
    if (!headerRow || dataRows.length === 0) return [{ line: 1, operation: '', relationType: '', companyCode: '', subjectCode: '', relatedCode: '', startsAt: '', status: 'blocked' as const, message: 'O arquivo precisa conter cabeçalho e ao menos uma linha de dados.' }]
    const headers = headerRow.map(normalizeImportHeader)
    const valueAt = (row: string[], aliases: string[]) => row[headers.findIndex((header) => aliases.includes(header))] ?? ''
    const expected = [
      ['operacao'], ['tipo_relacao', 'tiporelacao'], ['subordinado_empresa_codigo', 'empresa_codigo', 'codigo_empresa', 'company_external_code', 'external_code'],
      ['subordinado_matricula_erp', 'codigo_colaborador', 'matricula_colaborador', 'subject_employee_code', 'codigo_subordinado'],
      ['gestor_matricula_erp', 'codigo_responsavel', 'matricula_responsavel', 'related_employee_code', 'codigo_gestor', 'codigo_gestor_responsavel'],
      ['data_inicio', 'inicio', 'starts_at'],
      // gestor_empresa_codigo é recomendado; se vier vazio, usa a empresa do subordinado para relações internas.
      ['gestor_empresa_codigo', 'empresa_gestor_codigo', 'responsavel_empresa_codigo', 'related_company_code'], 
    ]
    if (expected.some((aliases) => !headers.some((header) => aliases.includes(header)))) return [{ line: 1, operation: '', relationType: '', companyCode: '', subjectCode: '', relatedCode: '', startsAt: '', status: 'blocked' as const, message: 'Cabeçalho inválido. Use o modelo: operacao;subordinado_matricula_erp;subordinado_nome;subordinado_empresa_codigo;gestor_matricula_erp;gestor_nome;tipo_relacao;inicio.' }]
    const today = new Date().toISOString().slice(0, 10)
    const activeAssignments = assignments.filter((assignment) => assignment.starts_at <= today && (!assignment.ends_at || assignment.ends_at >= today))
    const employeesById = new Map(employees.map((employee) => [employee.id, employee]))
    const byCompanyAndCode = new Map<string, Assignment[]>()
    activeAssignments.forEach((assignment) => {
      if (!assignment.company_id || !assignment.source_employee_code) return
      const key = `${assignment.company_id}:${normalizeImportValue(assignment.source_employee_code)}`
      byCompanyAndCode.set(key, [...(byCompanyAndCode.get(key) ?? []), assignment])
    })
    const companyByCode = new Map(companies.filter((company) => company.external_code).map((company) => [normalizeImportValue(company.external_code!), company]))
    const directManagerSubjects = new Set<string>()
    const preview: ImportRelationship[] = dataRows.map((row, index): ImportRelationship => {
      const operation = normalizeImportValue(valueAt(row, ['operacao']))
      const relationType = normalizeImportValue(valueAt(row, ['tipo_relacao', 'tiporelacao']))
      const companyCode = valueAt(row, ['subordinado_empresa_codigo', 'empresa_codigo', 'codigo_empresa', 'company_external_code', 'external_code']).trim()
      const subjectCode = valueAt(row, ['subordinado_matricula_erp', 'codigo_colaborador', 'matricula_colaborador', 'subject_employee_code', 'codigo_subordinado']).trim()
      const relatedCode = valueAt(row, ['gestor_matricula_erp', 'codigo_responsavel', 'matricula_responsavel', 'related_employee_code', 'codigo_gestor', 'codigo_gestor_responsavel']).trim()
      const relatedCompanyCode = valueAt(row, ['gestor_empresa_codigo', 'empresa_gestor_codigo', 'responsavel_empresa_codigo', 'related_company_code']).trim() || companyCode
      const startsAt = parseImportDate(valueAt(row, ['data_inicio', 'inicio', 'starts_at']))
      const base = { line: index + 2, operation, relationType, companyCode, subjectCode, relatedCode, startsAt: startsAt ?? '', status: 'blocked' as ImportStatus, message: '' }
      if (!['INCLUIR', 'CRIAR'].includes(operation)) return { ...base, message: 'Operação deve ser INCLUIR ou CRIAR.' }
      const kind: ImportRelationship['kind'] = relationType === 'HIERARQUICA' ? 'direct_manager' : relationType === 'FUNCIONAL' ? 'functional_owner' : undefined
      if (!kind) return { ...base, message: 'Tipo de relação deve ser HIERARQUICA ou FUNCIONAL.' }
      if (!companyCode || !subjectCode || !relatedCode || !startsAt) return { ...base, message: 'Empresa, colaborador, responsável e data de início válida são obrigatórios.' }
      const company = companyByCode.get(normalizeImportValue(companyCode))
      if (!company) return { ...base, message: 'Empresa não encontrada pelo external_code.' }
      const relatedCompany = companyByCode.get(normalizeImportValue(relatedCompanyCode))
      const subjectMatches = byCompanyAndCode.get(`${company.id}:${normalizeImportValue(subjectCode)}`) ?? []
      const relatedMatches = relatedCompany ? byCompanyAndCode.get(`${relatedCompany.id}:${normalizeImportValue(relatedCode)}`) ?? [] : []
      if (subjectMatches.length !== 1 || relatedMatches.length !== 1) return { ...base, companyId: company.id, kind, message: subjectMatches.length !== 1 ? 'Colaborador não encontrado ou ambíguo nos vínculos ativos da empresa.' : !relatedCompany ? 'Empresa do responsável não encontrada pelo external_code.' : 'Responsável não encontrado ou ambíguo nos vínculos ativos da empresa informada.' }
      const subjectEmployeeId = subjectMatches[0].employee_id
      const relatedEmployeeId = relatedMatches[0].employee_id
      if (!employeesById.has(subjectEmployeeId) || !employeesById.has(relatedEmployeeId)) return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, message: 'Pessoa não encontrada nos cadastros carregados.' }
      if (subjectEmployeeId === relatedEmployeeId) return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, message: 'Autorrelação não é permitida.' }
      if (kind === 'direct_manager') {
        if (directManagerSubjects.has(subjectEmployeeId)) return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, message: 'Gestor direto duplicado dentro do arquivo para este colaborador.' }
        directManagerSubjects.add(subjectEmployeeId)
      }
      const existing = relationships.find((relationship) => !relationship.ends_at && relationship.subject_employee_id === subjectEmployeeId && relationship.related_employee_id === relatedEmployeeId && relationship.kind === kind)
      if (existing) return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, status: 'alert' as const, message: 'Relação idêntica já está vigente e será ignorada.' }
      if (kind === 'direct_manager' && relationships.some((relationship) => !relationship.ends_at && relationship.subject_employee_id === subjectEmployeeId && relationship.kind === 'direct_manager')) return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, message: 'O colaborador já possui um gestor direto vigente.' }
      return { ...base, companyId: company.id, kind, subjectEmployeeId, relatedEmployeeId, status: 'ready' as const, message: 'Pronta para aplicar.' }
    })

    // The hierarchy graph exists only for this preview. It never derives or writes relationships.
    const currentDirectManagers = relationships.filter((relationship) => relationship.kind === 'direct_manager' && relationship.starts_at <= today && (!relationship.ends_at || relationship.ends_at >= today))
    const directManagerBySubject = new Map<string, string>()
    currentDirectManagers.forEach((relationship) => {
      if (!directManagerBySubject.has(relationship.subject_employee_id)) directManagerBySubject.set(relationship.subject_employee_id, relationship.related_employee_id)
    })
    preview.filter((row) => row.status === 'ready' && row.kind === 'direct_manager' && row.subjectEmployeeId && row.relatedEmployeeId).forEach((row) => {
      directManagerBySubject.set(row.subjectEmployeeId!, row.relatedEmployeeId!)
    })
    const isDirectManagerAncestor = (employeeId: string, possibleAncestorId: string) => {
      const visited = new Set<string>()
      let currentId = employeeId
      while (!visited.has(currentId)) {
        visited.add(currentId)
        const managerId = directManagerBySubject.get(currentId)
        if (!managerId) return false
        if (managerId === possibleAncestorId) return true
        currentId = managerId
      }
      return false
    }
    return preview.map((row) => row.status === 'ready' && row.kind === 'functional_owner' && row.subjectEmployeeId && row.relatedEmployeeId && isDirectManagerAncestor(row.subjectEmployeeId, row.relatedEmployeeId)
      ? { ...row, status: 'alert' as const, message: 'Relação funcional redundante: o responsável já é superior hierárquico na cadeia de gestor direto e não será aplicada.' }
      : row)
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImportRows([]); setImportReport(null); setImportFileName(file?.name ?? '')
    if (!file) return
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) { setStructureError('Selecione um arquivo CSV separado por ponto e vírgula.'); return }
    try { setStructureError(null); setImportRows(validateImportRows(parseSemicolonCsv(await file.text()))) }
    catch { setStructureError('Não foi possível ler o arquivo CSV. Salve-o como UTF-8 e tente novamente.') }
    finally { event.target.value = '' }
  }

  async function applyReadyImportRelationships() {
    const readyRows = importRows.filter((row) => row.status === 'ready')
    if (!supabase || readyRows.length === 0 || !window.confirm(`Aplicar ${readyRows.length} relações prontas? Linhas com alerta ou bloqueio não serão enviadas.`)) return
    const client = supabase
    setImportApplying(true); setStructureError(null); setImportReport(null)
    const failures: Array<{ line: number; message: string }> = []
    let inserted = 0
    for (let index = 0; index < readyRows.length; index += 20) {
      const batch = readyRows.slice(index, index + 20)
      const results = await Promise.all(batch.map(async (row) => ({ row, result: await client.from('employee_relationships').insert({ subject_employee_id: row.subjectEmployeeId!, related_employee_id: row.relatedEmployeeId!, kind: row.kind!, company_id: row.companyId!, starts_at: row.startsAt }) })))
      results.forEach(({ row, result }) => { if (result.error) failures.push({ line: row.line, message: result.error.code === '23505' ? 'Conflito de relação vigente.' : result.error.message }); else inserted += 1 })
    }
    setImportReport({ inserted, failed: failures }); setImportApplying(false)
    setOperationNotice(`${inserted} relação${inserted === 1 ? '' : 'ões'} importada${inserted === 1 ? '' : 's'}; ${failures.length} falha${failures.length === 1 ? '' : 's'} preservada${failures.length === 1 ? '' : 's'} no relatório.`)
    await refreshStructure()
    setImportRows((current) => current.map((row) => failures.some((failure) => failure.line === row.line) ? { ...row, status: 'blocked', message: failures.find((failure) => failure.line === row.line)?.message ?? row.message } : row.status === 'ready' ? { ...row, status: 'alert', message: 'Aplicada nesta importação.' } : row))
  }

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
    const targetEmployeeId = String(form.get('related_employee_id'))
    const selectedIsResponsible = form.get('direction') === 'selected_is_responsible'
    const { error } = await supabase.from('employee_relationships').insert({
      subject_employee_id: selectedIsResponsible ? targetEmployeeId : selectedEmployeeId,
      related_employee_id: selectedIsResponsible ? selectedEmployeeId : targetEmployeeId,
      kind: String(form.get('kind')),
      starts_at: String(form.get('starts_at')),
    })
    if (error) return setStructureError(error.code === '23505' ? 'Esta pessoa já possui um gestor direto vigente. Encerre ou altere a relação atual antes de definir outro.' : `Não foi possível criar a relação organizacional: ${error.message}`)
    setStructureError(null)
    setOperationNotice('Relação organizacional adicionada com sucesso.')
    event.currentTarget.reset(); void refreshStructure()
  }

  async function reverseRelationship(relationship: Relationship) {
    if (!supabase || !window.confirm('Inverter a direção desta relação?')) return
    const { error } = await supabase.from('employee_relationships').update({ subject_employee_id: relationship.related_employee_id, related_employee_id: relationship.subject_employee_id }).eq('id', relationship.id)
    if (error) return setStructureError('Não foi possível inverter a direção da relação.')
    setOperationNotice('Direção da relação organizacional invertida com sucesso.')
    void refreshStructure()
  }

  async function endRelationship(relationship: Relationship) {
    if (!supabase || !window.confirm('Encerrar esta relação hoje? O histórico será preservado.')) return
    const { error } = await supabase.from('employee_relationships').update({ ends_at: new Date().toISOString().slice(0, 10) }).eq('id', relationship.id)
    if (error) return setStructureError('Não foi possível encerrar a relação organizacional.')
    setOperationNotice('Relação organizacional encerrada; o histórico foi preservado.')
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

  async function createResponsibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('responsibility_catalog').insert({
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim() || null,
    })
    if (error) return setStructureError(error.code === '23505' ? 'Já existe uma responsabilidade com esse nome.' : 'Não foi possível criar a responsabilidade.')
    event.currentTarget.reset()
    setOperationNotice('Responsabilidade adicionada ao catálogo.')
    void refreshStructure()
  }

  async function editResponsibility(item: ResponsibilityCatalogItem) {
    if (!supabase) return
    const name = window.prompt('Nome da responsabilidade:', item.name)?.trim()
    if (!name) return
    const description = window.prompt('Descrição (opcional):', item.description ?? '')?.trim()
    if (description === undefined) return
    const { error } = await supabase.from('responsibility_catalog').update({ name, description: description || null }).eq('id', item.id)
    if (error) return setStructureError('Não foi possível atualizar a responsabilidade.')
    setOperationNotice('Responsabilidade atualizada.')
    void refreshStructure()
  }

  async function toggleResponsibility(item: ResponsibilityCatalogItem) {
    if (!supabase) return
    const { error } = await supabase.from('responsibility_catalog').update({ active: !item.active }).eq('id', item.id)
    if (error) return setStructureError('Não foi possível atualizar o status da responsabilidade.')
    setOperationNotice(`Responsabilidade ${item.active ? 'inativada' : 'ativada'}.`)
    void refreshStructure()
  }

  async function createAssignmentResponsibility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('assignment_responsibilities').insert({
      assignment_id: String(form.get('assignment_id')),
      responsibility_id: String(form.get('responsibility_id')),
      starts_at: String(form.get('starts_at')),
      ends_at: String(form.get('ends_at')) || null,
    })
    if (error) return setStructureError(error.code === '23505' ? 'Esta responsabilidade já está atribuída a este vínculo com o mesmo início.' : 'Não foi possível atribuir a responsabilidade. Confira o vínculo e a vigência.')
    event.currentTarget.reset()
    setOperationNotice('Responsabilidade atribuída ao vínculo.')
    void refreshStructure()
  }

  async function endAssignmentResponsibility(item: AssignmentResponsibility) {
    if (!supabase || !window.confirm('Encerrar esta responsabilidade hoje? O histórico será preservado.')) return
    const { error } = await supabase.from('assignment_responsibilities').update({ ends_at: new Date().toISOString().slice(0, 10) }).eq('id', item.id)
    if (error) return setStructureError('Não foi possível encerrar a responsabilidade.')
    setOperationNotice('Responsabilidade encerrada; o histórico foi preservado.')
    void refreshStructure()
  }

  async function createPermissionGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const scope = String(form.get('scope')) as AuthorizationScope | ''
    const scopeId = String(form.get('scope_id'))
    const scopeFields: Record<AuthorizationScope, string> = { company: 'company_id', unit: 'unit_id', area: 'area_id', team: 'team_id', person: 'employee_id' }
    const grant: Record<string, string | null> = {
      user_id: String(form.get('user_id')),
      permission_key: String(form.get('permission_key')),
      effect: String(form.get('effect')),
      classification: String(form.get('classification')) || null,
      starts_at: `${String(form.get('starts_at'))}T00:00:00.000Z`,
      ends_at: String(form.get('ends_at')) ? `${String(form.get('ends_at'))}T23:59:59.999Z` : null,
      reason: String(form.get('reason')).trim(),
      granted_by: session?.user.id ?? null,
    }
    if (scope && scopeId) grant[scopeFields[scope]] = scopeId
    const { error } = await supabase.from('user_permission_grants').insert(grant)
    if (error) return setStructureError('Não foi possível registrar a concessão. Confira vigência, escopo e dados obrigatórios.')
    event.currentTarget.reset()
    setAuthorizationScope('')
    setStructureError(null)
    setOperationNotice('Concessão individual registrada com sucesso.')
    void refreshStructure()
  }

  async function endPermissionGrant(grant: PermissionGrant) {
    if (!supabase || !window.confirm('Encerrar esta concessão hoje? O histórico será preservado.')) return
    const { error } = await supabase.from('user_permission_grants').update({ ends_at: `${AUTHORIZATION_TODAY}T23:59:59.999Z` }).eq('id', grant.id)
    if (error) return setStructureError('Não foi possível encerrar a concessão.')
    setOperationNotice('Concessão encerrada; o histórico foi preservado.')
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
    {isRootAdmin && <nav className="module-nav" aria-label="Módulos da plataforma">{([{ key: 'home', label: 'Visão geral' }, { key: 'structure', label: 'Estrutura' }, { key: 'people', label: 'Pessoas & vínculos' }, { key: 'responsibilities', label: 'Responsabilidades' }, { key: 'organogram', label: 'Organograma' }, { key: 'imports', label: 'Importações' }, { key: 'authorizations', label: 'Autorizações' }, { key: 'audit', label: 'Auditoria' }] as Array<{ key: ModuleKey; label: string }>).map((module) => <button className={activeModule === module.key ? 'module-active' : ''} type="button" key={module.key} onClick={() => setActiveModule(module.key)}>{module.label}</button>)}</nav>}
    {structureError && <p className="form-error">{structureError}</p>}{operationNotice && <p className="operation-notice">{operationNotice}</p>}
    {isRootAdmin && activeModule === 'structure' && <section className="structure-section"><div className="section-heading"><div><p className="eyebrow">Configuração organizacional</p><h2>Empresas, unidades e áreas</h2><p>Cadastros vivos para refletir mudanças da operação sem depender de código.</p></div><button className="outline-button" type="button" onClick={() => void refreshStructure()} disabled={structureLoading}>{structureLoading ? 'Atualizando…' : 'Atualizar'}</button></div>{structureError && <p className="form-error">{structureError}</p>}<div className="structure-grid"><article className="structure-card"><h3>Empresas</h3><form onSubmit={createCompany}><input name="name" placeholder="Nome da empresa" required /><input name="legal_name" placeholder="Razão social (opcional)" /><input name="registration_number" placeholder="CNPJ (opcional)" /><button type="submit">Adicionar empresa</button></form><RecordList records={companies} onRename={(item) => void rename('companies', item.id, item.name)} onToggle={(item) => void toggleActive('companies', item.id, item.active)} /></article><article className="structure-card"><h3>Áreas</h3><form onSubmit={createArea}><input name="name" placeholder="Nome da área" required /><input name="code" placeholder="Sigla (opcional)" /><select name="parent_area_id" defaultValue=""><option value="">Área principal (opcional)</option>{areas.filter((area) => area.active).map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select><button type="submit">Adicionar área</button></form><RecordList records={areas} onRename={(item) => void rename('org_areas', item.id, item.name)} onToggle={(item) => void toggleActive('org_areas', item.id, item.active)} /></article><article className="structure-card"><h3>Unidades</h3><form onSubmit={createUnit}><select name="company_id" required defaultValue=""><option value="" disabled>Selecione a empresa</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><input name="name" placeholder="Nome da unidade" required /><input name="code" placeholder="Código (opcional)" /><select name="parent_unit_id" defaultValue=""><option value="">Unidade principal (opcional)</option>{units.filter((unit) => unit.active).map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</select><button type="submit" disabled={!companies.some((company) => company.active)}>Adicionar unidade</button></form><RecordList records={units.map((unit) => ({ ...unit, detail: companies.find((company) => company.id === unit.company_id)?.name ?? 'Empresa não encontrada' }))} onRename={(item) => void rename('org_units', item.id, item.name)} onToggle={(item) => void toggleActive('org_units', item.id, item.active)} /></article><article className="structure-card"><h3>Cargos</h3><form onSubmit={createJobRole}><input name="name" placeholder="Nome do cargo" required /><input name="cbo_code" placeholder="Código CBO (opcional)" /><button type="submit">Adicionar cargo</button></form><RecordList records={jobRoles} onRename={(item) => void rename('job_roles', item.id, item.name)} onToggle={(item) => void toggleActive('job_roles', item.id, item.active)} /></article><article className="structure-card"><h3>Equipes</h3><form onSubmit={createTeam}><input name="name" placeholder="Nome da equipe" required /><select name="company_id" defaultValue=""><option value="">Empresa (opcional)</option>{companies.filter((company) => company.active).map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><select name="area_id" defaultValue=""><option value="">Área (opcional)</option>{areas.filter((area) => area.active).map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select><button type="submit">Adicionar equipe</button></form><RecordList records={teams.map((team) => ({ ...team, detail: areas.find((area) => area.id === team.area_id)?.name ?? companies.find((company) => company.id === team.company_id)?.name ?? 'Sem escopo definido' }))} onRename={(item) => void rename('teams', item.id, item.name)} onToggle={(item) => void toggleActive('teams', item.id, item.active)} /></article></div></section>}
    {isRootAdmin && activeModule === 'people' && <section className="people-section"><div className="section-heading"><div><p className="eyebrow">Pessoas e vínculos</p><h2>Perfil organizacional</h2><p>Defina a empresa de registro e as atuações adicionais de cada pessoa, com histórico preservado.</p></div></div><div className="people-layout"><aside className="people-list"><label>Localizar pessoa<input value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} placeholder="Nome do colaborador" /></label><p>{visibleEmployees.length} pessoas encontradas</p><div>{visibleEmployees.map((employee) => <button className={employee.id === selectedEmployeeId ? 'person-selected' : ''} key={employee.id} type="button" onClick={() => setSelectedEmployeeId(employee.id)}>{employee.full_name}</button>)}</div></aside><article className="assignment-card">{selectedEmployee ? <><div className="person-title"><div><p className="eyebrow">Cadastro selecionado</p><h3>{selectedEmployee.full_name}</h3></div><span className={selectedEmployee.active ? 'record-active' : 'record-inactive'}>{selectedEmployee.active ? 'Ativo' : 'Inativo'}</span></div><h4>Vínculos atuais e históricos</h4><div className="assignment-list">{selectedAssignments.length === 0 && <p className="empty-state">Nenhum vínculo registrado.</p>}{selectedAssignments.map((assignment) => <div className="assignment-row" key={assignment.id}><div><strong>{companies.find((company) => company.id === assignment.company_id)?.name ?? 'Sem empresa'}</strong><small>{jobRoles.find((role) => role.id === assignment.job_role_id)?.name ?? 'Sem função'} · {areas.find((area) => area.id === assignment.area_id)?.name ?? 'Sem área'} · {assignment.kind}</small><small>{assignment.starts_at}{assignment.ends_at ? ` até ${assignment.ends_at}` : ' · vigente'}{assignment.source_employee_code ? ` · matrícula ERP ${assignment.source_employee_code}` : ''}</small></div><div className="record-actions">{assignment.is_primary ? <span className="record-active">Registro principal</span> : !assignment.ends_at && <button type="button" onClick={() => void setPrimaryAssignment(assignment)}>Definir principal</button>}{!assignment.ends_at && <button type="button" onClick={() => void endAssignment(assignment)}>Encerrar</button>}</div></div>)}</div><h4>Novo vínculo</h4><form className="assignment-form" onSubmit={createAssignment}><select name="kind" defaultValue="functional"><option value="employment">Registro empregatício</option><option value="functional">Atuação funcional</option><option value="technical">Responsabilidade técnica</option><option value="process">Responsável por processo</option><option value="portfolio">Carteira</option><option value="temporary">Atuação temporária</option></select><select name="company_id" required defaultValue=""><option value="" disabled>Empresa</option>{companies.filter((company) => company.active).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><select name="unit_id" defaultValue=""><option value="">Unidade (opcional)</option>{units.filter((unit) => unit.active).map((unit) => <option key={unit.id} value={unit.id}>{companies.find((company) => company.id === unit.company_id)?.name} — {unit.name}</option>)}</select><select name="area_id" defaultValue=""><option value="">Área (opcional)</option>{areas.filter((area) => area.active).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select><select name="job_role_id" defaultValue=""><option value="">Função/cargo (opcional)</option>{jobRoles.filter((role) => role.active).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><label>Início<input name="starts_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="checkbox-label"><input name="is_primary" type="checkbox" /> Empresa de registro principal</label><textarea name="notes" placeholder="Observação (opcional)" /><button type="submit">Adicionar vínculo</button></form><h4>Relações organizacionais vigentes</h4><form className="assignment-form" onSubmit={createRelationship}><select name="direction" defaultValue="selected_is_responsible"><option value="selected_is_responsible">A pessoa selecionada é responsável por</option><option value="selected_reports_to">A pessoa selecionada responde a</option></select><select name="kind" defaultValue="direct_manager"><option value="direct_manager">Gestor direto</option><option value="secondary_manager">Gestor secundário</option><option value="functional_owner">Responsável funcional</option><option value="technical_owner">Responsável técnico</option><option value="approver">Aprovador</option><option value="mentor">Mentor</option><option value="delegate">Delegado</option></select><select name="related_employee_id" required defaultValue=""><option value="" disabled>Selecione a outra pessoa</option>{employees.filter((employee) => employee.id !== selectedEmployeeId && employee.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select><label>Início<input name="starts_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><button type="submit">Adicionar relação</button></form><div className="assignment-list">{relationships.filter((relationship) => (relationship.subject_employee_id === selectedEmployeeId || relationship.related_employee_id === selectedEmployeeId) && !relationship.ends_at).map((relationship) => { const selectedIsResponsible = relationship.related_employee_id === selectedEmployeeId; const otherId = selectedIsResponsible ? relationship.subject_employee_id : relationship.related_employee_id; return <div className="assignment-row" key={relationship.id}><div><strong>{employees.find((employee) => employee.id === otherId)?.full_name ?? 'Pessoa não encontrada'}</strong><small>{selectedIsResponsible ? 'É responsável por' : 'Responde a'} · {relationship.kind} · vigente desde {relationship.starts_at}</small></div><div className="record-actions"><button type="button" onClick={() => void reverseRelationship(relationship)}>Inverter direção</button><button type="button" onClick={() => void endRelationship(relationship)}>Encerrar relação</button></div></div>})}</div>{relationships.some((relationship) => (relationship.subject_employee_id === selectedEmployeeId || relationship.related_employee_id === selectedEmployeeId) && relationship.ends_at) && <><h4 className="history-heading">Histórico de relações encerradas</h4><div className="assignment-list relationship-history">{relationships.filter((relationship) => (relationship.subject_employee_id === selectedEmployeeId || relationship.related_employee_id === selectedEmployeeId) && relationship.ends_at).map((relationship) => { const selectedIsResponsible = relationship.related_employee_id === selectedEmployeeId; const otherId = selectedIsResponsible ? relationship.subject_employee_id : relationship.related_employee_id; return <div className="assignment-row" key={relationship.id}><div><strong>{employees.find((employee) => employee.id === otherId)?.full_name ?? 'Pessoa não encontrada'}</strong><small>{selectedIsResponsible ? 'Foi responsável por' : 'Respondeu a'} · {relationship.kind} · encerrada em {relationship.ends_at}</small></div></div>})}</div></>}</> : <p className="empty-state">Selecione uma pessoa para administrar seus vínculos.</p>}</article></div></section>}
    {activeModule === 'home' && <section className="foundation-grid" aria-label="Fundamentos da primeira entrega">{foundations.map(([title, description], index) => <article className="foundation-card" key={title}><span className="card-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</section>}
    {isRootAdmin && activeModule === 'responsibilities' && <ResponsibilitiesModule catalog={responsibilityCatalog} assignmentResponsibilities={assignmentResponsibilities} assignments={assignments} employees={employees} companies={companies} units={units} areas={areas} jobRoles={jobRoles} onCreate={createResponsibility} onEdit={(item) => void editResponsibility(item)} onToggle={(item) => void toggleResponsibility(item)} onAssign={createAssignmentResponsibility} onEnd={(item) => void endAssignmentResponsibility(item)} onRefresh={() => void refreshStructure()} loading={structureLoading} />}
    {isRootAdmin && activeModule === 'organogram' && <Organogram companies={companies} units={units} areas={areas} teams={teams} employees={employees} assignments={assignments} relationships={relationships} jobRoles={jobRoles} responsibilityCatalog={responsibilityCatalog} assignmentResponsibilities={assignmentResponsibilities} />}
    {isRootAdmin && activeModule === 'imports' && <ImportsModule rows={importRows} fileName={importFileName} report={importReport} applying={importApplying} onFileChange={handleImportFile} onApply={() => void applyReadyImportRelationships()} />}
    {isRootAdmin && activeModule === 'authorizations' && <AuthorizationsModule profiles={profiles} permissions={permissionCatalog} grants={permissionGrants} companies={companies} units={units} areas={areas} teams={teams} employees={employees} scope={authorizationScope} onScopeChange={setAuthorizationScope} onSubmit={createPermissionGrant} onEnd={(grant) => void endPermissionGrant(grant)} onRefresh={() => void refreshStructure()} loading={structureLoading} />}
    {isRootAdmin && activeModule === 'audit' && <AuditModule logs={auditLogs} profiles={profiles} onRefresh={() => void refreshStructure()} loading={structureLoading} />}
  </main>
}

function ImportsModule({ rows, fileName, report, applying, onFileChange, onApply }: { rows: ImportRelationship[]; fileName: string; report: ImportReport | null; applying: boolean; onFileChange: (event: ChangeEvent<HTMLInputElement>) => void; onApply: () => void }) {
  const totals = { ready: rows.filter((row) => row.status === 'ready').length, alert: rows.filter((row) => row.status === 'alert').length, blocked: rows.filter((row) => row.status === 'blocked').length }
  const issues = rows.filter((row) => row.status !== 'ready').slice(0, 20)
  return <section className="imports-section"><div className="section-heading"><div><p className="eyebrow">Carga assistida</p><h2>Importações</h2><p>Revise vínculos organizacionais antes de gravá-los. Nada é aplicado automaticamente.</p></div></div><article className="imports-card"><h3>Vínculos organizacionais CSV</h3><p>Arquivo UTF-8 separado por <strong>;</strong>. Use o modelo: <code>operacao;subordinado_matricula_erp;subordinado_nome;subordinado_empresa_codigo;gestor_matricula_erp;gestor_nome;tipo_relacao;inicio</code>.</p><p>Aceita <strong>INCLUIR</strong>/<strong>CRIAR</strong>, <strong>HIERARQUICA</strong>/<strong>FUNCIONAL</strong> e datas <strong>DD/MM/AAAA</strong> ou <strong>AAAA-MM-DD</strong>. <strong>HIERARQUICA</strong> define somente o gestor imediato; <strong>FUNCIONAL</strong> define responsável funcional e não integra a cadeia de gestão.</p><label className="file-input">Selecionar CSV<input type="file" accept=".csv,text/csv" onChange={onFileChange} /></label>{fileName && <small className="import-file-name">Arquivo analisado: {fileName}</small>}</article>{rows.length > 0 && <><div className="import-totals"><div><strong>{totals.ready}</strong><span>Prontas</span></div><div><strong>{totals.alert}</strong><span>Alertas</span></div><div><strong>{totals.blocked}</strong><span>Bloqueadas</span></div></div><article className="imports-card"><div className="import-card-heading"><div><h3>Prévia da validação</h3><p>{rows.length} linha{rows.length === 1 ? '' : 's'} processada{rows.length === 1 ? '' : 's'} somente no navegador, cruzando empresas, vínculos ativos e pessoas carregadas.</p></div><button type="button" onClick={onApply} disabled={totals.ready === 0 || applying}>{applying ? 'Aplicando…' : `Aplicar relações prontas (${totals.ready})`}</button></div>{issues.length > 0 && <div className="import-issues"><h4>Alertas e bloqueios (até 20 linhas)</h4><table><thead><tr><th>Linha</th><th>Status</th><th>Relação</th><th>Motivo</th></tr></thead><tbody>{issues.map((row) => <tr key={`${row.line}-${row.message}`}><td>{row.line}</td><td><span className={`import-status ${row.status}`}>{row.status === 'alert' ? 'Alerta' : 'Bloqueada'}</span></td><td>{row.subjectCode || '—'} → {row.relatedCode || '—'}</td><td>{row.message}</td></tr>)}</tbody></table></div>}{totals.ready > 0 && <p className="import-ready-note">As linhas prontas usarão <code>company_id</code> da empresa identificada pelo <code>external_code</code> e a data informada em <code>starts_at</code>.</p>}</article></>}{report && <article className="imports-card import-report"><h3>Relatório da aplicação</h3><p><strong>{report.inserted}</strong> relação{report.inserted === 1 ? '' : 'ões'} inserida{report.inserted === 1 ? '' : 's'}; <strong>{report.failed.length}</strong> falha{report.failed.length === 1 ? '' : 's'}.</p>{report.failed.length > 0 && <ul>{report.failed.map((failure) => <li key={failure.line}>Linha {failure.line}: {failure.message}</li>)}</ul>}</article>}</section>
}

function ResponsibilitiesModule({ catalog, assignmentResponsibilities, assignments, employees, companies, units, areas, jobRoles, onCreate, onEdit, onToggle, onAssign, onEnd, onRefresh, loading }: { catalog: ResponsibilityCatalogItem[]; assignmentResponsibilities: AssignmentResponsibility[]; assignments: Assignment[]; employees: Employee[]; companies: Company[]; units: Unit[]; areas: Area[]; jobRoles: JobRole[]; onCreate: (event: FormEvent<HTMLFormElement>) => void; onEdit: (item: ResponsibilityCatalogItem) => void; onToggle: (item: ResponsibilityCatalogItem) => void; onAssign: (event: FormEvent<HTMLFormElement>) => void; onEnd: (item: AssignmentResponsibility) => void; onRefresh: () => void; loading: boolean }) {
  const today = new Date().toISOString().slice(0, 10)
  const activeAssignments = assignments.filter((assignment) => !assignment.ends_at || assignment.ends_at >= today)
  const currentItems = assignmentResponsibilities.filter((item) => item.starts_at <= today && (!item.ends_at || item.ends_at >= today))
  const assignmentLabel = (assignment: Assignment) => {
    const employee = employees.find((item) => item.id === assignment.employee_id)?.full_name ?? 'Pessoa não encontrada'
    const company = companies.find((item) => item.id === assignment.company_id)?.name ?? 'Sem empresa'
    const location = [units.find((item) => item.id === assignment.unit_id)?.name, areas.find((item) => item.id === assignment.area_id)?.name].filter(Boolean).join(' · ')
    const jobRole = jobRoles.find((item) => item.id === assignment.job_role_id)?.name ?? 'Sem cargo'
    return `${employee} — ${company}${location ? ` · ${location}` : ''} · ${jobRole}`
  }
  return <section className="responsibilities-section"><div className="section-heading"><div><p className="eyebrow">Gestão de responsabilidades</p><h2>Responsabilidades por vínculo</h2><p>O catálogo é reutilizável; cada atribuição pertence a um vínculo organizacional e preserva seu histórico.</p></div><button className="outline-button" type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar'}</button></div><div className="responsibilities-layout"><div className="responsibilities-main"><article className="responsibility-card"><h3>Catálogo de responsabilidades</h3><p>Cadastre, descreva e controle quais responsabilidades podem ser atribuídas.</p><form className="responsibility-form" onSubmit={onCreate}><label>Nome<input name="name" placeholder="Ex.: Aprovação de despesas" required /></label><label>Descrição<textarea name="description" placeholder="Escopo e expectativa (opcional)" /></label><button type="submit">Adicionar responsabilidade</button></form><div className="responsibility-catalog-list">{catalog.length === 0 && <p className="empty-state">Nenhuma responsabilidade cadastrada.</p>}{catalog.map((item) => <div className="responsibility-catalog-row" key={item.id}><div><strong>{item.name}</strong><small>{item.description ?? 'Sem descrição.'}</small></div><div className="record-actions"><span className={item.active ? 'record-active' : 'record-inactive'}>{item.active ? 'Ativa' : 'Inativa'}</span><button type="button" onClick={() => onEdit(item)}>Editar</button><button type="button" onClick={() => onToggle(item)}>{item.active ? 'Inativar' : 'Ativar'}</button></div></div>)}</div></article><article className="responsibility-card"><h3>Atribuições vigentes</h3><p>{currentItems.length} responsabilidade{currentItems.length === 1 ? '' : 's'} vigente{currentItems.length === 1 ? '' : 's'}.</p><div className="responsibility-assignment-list">{currentItems.length === 0 && <p className="empty-state">Nenhuma responsabilidade vigente.</p>}{currentItems.map((item) => { const assignment = assignments.find((entry) => entry.id === item.assignment_id); const employee = employees.find((entry) => entry.id === assignment?.employee_id); const responsibility = catalog.find((entry) => entry.id === item.responsibility_id); return <div className="responsibility-assignment-row" key={item.id}><div><strong>{responsibility?.name ?? 'Responsabilidade não encontrada'}</strong><small>{employee?.full_name ?? 'Pessoa não encontrada'}</small><small>{assignment ? assignmentLabel(assignment).replace(`${employee?.full_name ?? 'Pessoa não encontrada'} — `, '') : 'Vínculo não encontrado'}</small><small>Início: {item.starts_at}</small></div><button className="grant-end-button" type="button" onClick={() => onEnd(item)}>Encerrar</button></div>})}</div></article></div><article className="responsibility-card responsibility-form-card"><h3>Nova atribuição</h3><p>Selecione a responsabilidade e o vínculo organizacional que a exercerá.</p><form className="responsibility-form" onSubmit={onAssign}><label>Responsabilidade<select name="responsibility_id" required defaultValue=""><option value="" disabled>Selecione a responsabilidade</option>{catalog.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Vínculo organizacional<select name="assignment_id" required defaultValue=""><option value="" disabled>Selecione o vínculo</option>{activeAssignments.map((assignment) => <option value={assignment.id} key={assignment.id}>{assignmentLabel(assignment)}</option>)}</select></label><label>Início<input name="starts_at" type="date" defaultValue={today} required /></label><label>Fim (opcional)<input name="ends_at" type="date" min={today} /></label><button type="submit" disabled={!catalog.some((item) => item.active) || activeAssignments.length === 0}>Atribuir responsabilidade</button></form></article></div></section>
}

function Organogram({ companies, units, areas, teams, employees, assignments, relationships, jobRoles, responsibilityCatalog, assignmentResponsibilities }: { companies: Company[]; units: Unit[]; areas: Area[]; teams: Team[]; employees: Employee[]; assignments: Assignment[]; relationships: Relationship[]; jobRoles: JobRole[]; responsibilityCatalog: ResponsibilityCatalogItem[]; assignmentResponsibilities: AssignmentResponsibility[] }) {
  const [scope, setScope] = useState<'company' | 'area' | 'unit' | 'team' | 'person'>('company')
  const [scopeId, setScopeId] = useState('')
  const options = scope === 'company' ? companies : scope === 'area' ? areas : scope === 'unit' ? units : scope === 'team' ? teams : employees
  const labelOf = (item: { name?: string; full_name?: string }) => item.name ?? item.full_name ?? ''
  const activeAssignments = assignments.filter((assignment) => !assignment.ends_at)
  const scoped = scope === 'company' ? activeAssignments.filter((assignment) => assignment.company_id === scopeId) : scope === 'area' ? activeAssignments.filter((assignment) => assignment.area_id === scopeId) : scope === 'unit' ? activeAssignments.filter((assignment) => assignment.unit_id === scopeId) : scope === 'team' ? activeAssignments.filter((assignment) => assignment.team_id === scopeId) : activeAssignments.filter((assignment) => assignment.employee_id === scopeId)
  const scopedPeople = employees.filter((employee) => scoped.some((assignment) => assignment.employee_id === employee.id))
  const today = new Date().toISOString().slice(0, 10)
  const scopedRelations = relationships.filter((relationship) => relationship.starts_at <= today && (!relationship.ends_at || relationship.ends_at >= today) && scopedPeople.some((person) => person.id === relationship.subject_employee_id || person.id === relationship.related_employee_id))
  const selectedPerson = employees.find((employee) => employee.id === scopeId)
  const personName = (id: string) => employees.find((employee) => employee.id === id)?.full_name ?? 'Não definido'
  const roleName = (assignment?: Assignment) => jobRoles.find((role) => role.id === assignment?.job_role_id)?.name ?? 'Cargo não definido'
  const filters = <div className="organogram-filters"><select value={scope} onChange={(event) => { setScope(event.target.value as typeof scope); setScopeId('') }}><option value="company">Por empresa</option><option value="area">Por área</option><option value="unit">Por unidade</option><option value="team">Por equipe</option><option value="person">Por pessoa</option></select><select value={scopeId} onChange={(event) => setScopeId(event.target.value)}><option value="">Selecione o filtro</option>{options.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{labelOf(item)}</option>)}</select></div>
  if (scope === 'person' && selectedPerson) return <section className="organogram-section"><div className="section-heading"><div><p className="eyebrow">Organograma operacional</p><h2>Pessoa 360º</h2><p>Relações, vínculos e responsabilidades do perfil selecionado.</p></div></div>{filters}<Person360 key={selectedPerson.id} person={selectedPerson} assignments={scoped} relationships={relationships.filter((relationship) => relationship.starts_at <= today && (!relationship.ends_at || relationship.ends_at >= today))} employees={employees} companies={companies} units={units} areas={areas} jobRoles={jobRoles} responsibilityCatalog={responsibilityCatalog} assignmentResponsibilities={assignmentResponsibilities} /></section>
  const selectedLabel = labelOf(options.find((item) => item.id === scopeId) ?? {})
  const assignmentFor = (id: string) => scoped.find((assignment) => assignment.employee_id === id)
  const detailCards = scopedPeople.sort((a, b) => a.full_name.localeCompare(b.full_name)).map((person) => {
    const assignment = assignmentFor(person.id)
    const manager = scopedRelations.find((relationship) => relationship.subject_employee_id === person.id && ['direct_manager', 'secondary_manager'].includes(relationship.kind))
    return <article className="scope-person-card" key={person.id}><strong>{person.full_name}</strong><span>{roleName(assignment)}</span><small>{manager ? `Responde a ${personName(manager.related_employee_id)}` : 'Sem gestor configurado'}</small></article>
  })
  const companyUnits = units.filter((unit) => scoped.some((assignment) => assignment.unit_id === unit.id))
  const executiveCards = companyUnits.map((unit) => {
    const unitAssignments = scoped.filter((assignment) => assignment.unit_id === unit.id)
    const unitPeople = [...new Set(unitAssignments.map((assignment) => assignment.employee_id))]
    const leaders = unitPeople.filter((id) => scopedRelations.some((relationship) => relationship.related_employee_id === id && ['direct_manager', 'secondary_manager'].includes(relationship.kind)))
    const roles = [...new Set(unitAssignments.map((assignment) => roleName(assignment)))].filter(Boolean)
    return <article className="scope-unit-card" key={unit.id}><h3>{unit.name}</h3><p>{leaders.length ? leaders.map(personName).join(' · ') : 'Liderança não definida'}</p><small>{roles.slice(0, 5).join(' · ')}{roles.length > 5 ? ` · +${roles.length - 5} cargos` : ''}</small><span>{unitPeople.length} pessoas</span></article>
  })
  return <section className="organogram-section"><div className="section-heading"><div><p className="eyebrow">Organograma operacional</p><h2>{scope === 'company' ? 'Visão executiva por empresa' : 'Visão detalhada da estrutura'}</h2><p>{scope === 'company' ? 'Unidades, lideranças configuradas e composição de cargos.' : 'Pessoas, cargos e relações de gestão no escopo selecionado.'}</p></div></div>{filters}{scopeId && <div className="structural-chart"><div className="flow-root">{selectedLabel}</div><div className={scope === 'company' ? 'executive-branches' : 'detail-branches'}>{scope === 'company' ? executiveCards : detailCards}</div></div>}<p className="organogram-note">{scopedPeople.length} pessoas · {scoped.length} vínculos · {scopedRelations.length} relações vigentes no escopo</p></section>
}

function Person360({ person, assignments, relationships, employees, companies, units, areas, jobRoles, responsibilityCatalog, assignmentResponsibilities }: { person: Employee; assignments: Assignment[]; relationships: Relationship[]; employees: Employee[]; companies: Company[]; units: Unit[]; areas: Area[]; jobRoles: JobRole[]; responsibilityCatalog: ResponsibilityCatalogItem[]; assignmentResponsibilities: AssignmentResponsibility[] }) {
  const labels: Record<string, string> = { direct_manager: 'Gestor direto', secondary_manager: 'Gestor secundário', functional_owner: 'Responsável funcional', technical_owner: 'Responsável técnico', approver: 'Aprovador', reviewer: 'Revisor', mentor: 'Mentor', delegate: 'Delegado', focal_point: 'Ponto focal' }
  const personName = (id: string) => employees.find((employee) => employee.id === id)?.full_name ?? 'Pessoa não encontrada'
  const directManagerBySubject = new Map<string, Relationship>()
  relationships.filter((relationship) => relationship.kind === 'direct_manager').forEach((relationship) => {
    if (!directManagerBySubject.has(relationship.subject_employee_id)) directManagerBySubject.set(relationship.subject_employee_id, relationship)
  })
  const directManagerChain: Relationship[] = []
  const visitedEmployees = new Set<string>()
  let currentEmployeeId = person.id
  while (!visitedEmployees.has(currentEmployeeId)) {
    visitedEmployees.add(currentEmployeeId)
    const managerRelation = directManagerBySubject.get(currentEmployeeId)
    if (!managerRelation || visitedEmployees.has(managerRelation.related_employee_id)) break
    directManagerChain.push(managerRelation)
    currentEmployeeId = managerRelation.related_employee_id
  }
  const secondaryManagerRelations = relationships.filter((relationship) => relationship.subject_employee_id === person.id && relationship.kind === 'secondary_manager')
  const subordinateRelations = relationships.filter((relationship) => relationship.related_employee_id === person.id && relationship.kind === 'direct_manager')
  const primary = assignments.find((assignment) => assignment.is_primary) ?? assignments.find((assignment) => assignment.kind === 'employment') ?? assignments[0]
  const card = (title: string, color: string, body: any) => <article className={`person360-card ${color}`}><div className="person360-card-title"><h3>{title}</h3></div>{body}</article>
  const empty = <p className="empty-state">Nada configurado ainda.</p>
  const locations = assignments.length ? <div className="person360-list">{assignments.map((assignment) => <div key={assignment.id}><strong>{companies.find((company) => company.id === assignment.company_id)?.name ?? 'Sem empresa'}</strong><small>{units.find((unit) => unit.id === assignment.unit_id)?.name ?? 'Sem unidade'} · {areas.find((area) => area.id === assignment.area_id)?.name ?? 'Sem área'}</small></div>)}</div> : empty
  const managers = directManagerChain.length || secondaryManagerRelations.length ? <div className="person360-list">{directManagerChain.length > 0 && <div><strong>{personName(directManagerChain[0].related_employee_id)}</strong><small>Gestor direto</small>{directManagerChain.length > 1 && <ol className="management-chain"><li>Superiores indiretos</li>{directManagerChain.slice(1).map((relationship) => <li key={relationship.id}>{personName(relationship.related_employee_id)}</li>)}</ol>}</div>}{secondaryManagerRelations.map((relationship) => <div key={relationship.id}><strong>{personName(relationship.related_employee_id)}</strong><small>Gestor secundário · relação adicional</small></div>)}</div> : empty
  const roles = assignments.length ? <div className="person360-list">{assignments.map((assignment) => <div key={assignment.id}><strong>{jobRoles.find((role) => role.id === assignment.job_role_id)?.name ?? 'Sem cargo definido'}</strong><small>{assignment.kind} · início {assignment.starts_at}</small></div>)}</div> : empty
  const responsibilities = assignmentResponsibilities.filter((item) => !item.ends_at && assignments.some((assignment) => assignment.id === item.assignment_id)).length ? <div className="person360-list">{assignmentResponsibilities.filter((item) => !item.ends_at && assignments.some((assignment) => assignment.id === item.assignment_id)).map((item) => { const assignment = assignments.find((entry) => entry.id === item.assignment_id); return <div key={item.id}><strong>{responsibilityCatalog.find((responsibility) => responsibility.id === item.responsibility_id)?.name ?? 'Responsabilidade não encontrada'}</strong><small>{jobRoles.find((role) => role.id === assignment?.job_role_id)?.name ?? 'Sem cargo'} · desde {item.starts_at}</small></div> })}</div> : empty
  const subordinates = subordinateRelations.length ? <div className="person360-list">{subordinateRelations.map((relationship) => <div key={relationship.id}><strong>{personName(relationship.subject_employee_id)}</strong><small>{labels[relationship.kind] ?? relationship.kind}</small><button className="relation-reverse" type="button" onClick={() => void invertRelationship(relationship)}>Inverter direção</button></div>)}</div> : empty
  const invertRelationship = async (relationship: Relationship) => {
    if (!supabase || !window.confirm('Inverter a direção desta relação?')) return
    const { error } = await supabase.from('employee_relationships').update({ subject_employee_id: relationship.related_employee_id, related_employee_id: relationship.subject_employee_id }).eq('id', relationship.id)
    if (error) return window.alert('Não foi possível inverter a relação.')
    window.location.reload()
  }
  const origin = assignments.filter((assignment) => assignment.kind === 'employment').length ? <div className="person360-list">{assignments.filter((assignment) => assignment.kind === 'employment').map((assignment) => <div key={assignment.id}><strong>Vínculo empregatício</strong><small>Admissão {assignment.starts_at}{assignment.source_employee_code ? ` · matrícula ${assignment.source_employee_code}` : ''}</small></div>)}</div> : empty
  return <section className="person360-shell"><div className="person360-legend"><span className="legend-link">Gestão</span><span className="legend-work">Vínculos e locais</span><span className="legend-role">Cargos</span><span className="legend-responsibility">Responsabilidades</span></div><div className="person360">{card('Vínculos e locais', 'companies', locations)}{card('Gestão', 'managers', managers)}{card('Cargos e atuações', 'roles', roles)}{card('Responsabilidades', 'responsibilities', responsibilities)}<article className="person360-center"><div className="person360-avatar">{person.full_name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</div><h3>{person.full_name}</h3><p>{jobRoles.find((role) => role.id === primary?.job_role_id)?.name ?? 'Cargo não definido'}</p><small>{companies.find((company) => company.id === primary?.company_id)?.name ?? 'Empresa não definida'}</small>{primary?.source_employee_code && <span>Matrícula ERP {primary.source_employee_code}</span>}</article>{card('Pessoas sob gestão', 'subordinates', subordinates)}{card('Registro de origem', 'contracts', origin)}</div></section>
}

function AuthorizationsModule({ profiles, permissions, grants, companies, units, areas, teams, employees, scope, onScopeChange, onSubmit, onEnd, onRefresh, loading }: { profiles: Profile[]; permissions: PermissionCatalogItem[]; grants: PermissionGrant[]; companies: Company[]; units: Unit[]; areas: Area[]; teams: Team[]; employees: Employee[]; scope: AuthorizationScope | ''; onScopeChange: (scope: AuthorizationScope | '') => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onEnd: (grant: PermissionGrant) => void; onRefresh: () => void; loading: boolean }) {
  const permissionsByModule = permissions.filter((permission) => permission.active).reduce<Record<string, PermissionCatalogItem[]>>((grouped, permission) => { (grouped[permission.module] ??= []).push(permission); return grouped }, {})
  const scopeOptions = scope === 'company' ? companies.filter((item) => item.active) : scope === 'unit' ? units.filter((item) => item.active) : scope === 'area' ? areas.filter((item) => item.active) : scope === 'team' ? teams.filter((item) => item.active) : employees.filter((item) => item.active)
  const scopeLabel = (grant: PermissionGrant) => {
    if (grant.company_id) return `Empresa: ${companies.find((item) => item.id === grant.company_id)?.name ?? 'não encontrada'}`
    if (grant.unit_id) return `Unidade: ${units.find((item) => item.id === grant.unit_id)?.name ?? 'não encontrada'}`
    if (grant.area_id) return `Área: ${areas.find((item) => item.id === grant.area_id)?.name ?? 'não encontrada'}`
    if (grant.team_id) return `Equipe: ${teams.find((item) => item.id === grant.team_id)?.name ?? 'não encontrada'}`
    if (grant.employee_id) return `Pessoa: ${employees.find((item) => item.id === grant.employee_id)?.full_name ?? 'não encontrada'}`
    return 'Toda a empresa'
  }
  const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/New_York' }).format(new Date(value))
  return <section className="authorizations-section"><div className="section-heading"><div><p className="eyebrow">Controle de acesso</p><h2>Autorizações individuais</h2><p>Concessões explícitas, com escopo, classificação e vigência. A RLS do banco permanece como camada de proteção.</p></div><button className="outline-button" type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar'}</button></div><div className="authorizations-layout"><div className="authorizations-main"><article className="authorization-card"><div className="authorization-card-heading"><div><h3>Concessões vigentes</h3><p>{grants.length} concess{grants.length === 1 ? 'ão' : 'ões'} ativa{grants.length === 1 ? '' : 's'}</p></div></div><div className="grant-list">{grants.length === 0 && <p className="empty-state">Nenhuma concessão individual vigente.</p>}{grants.map((grant) => <div className="grant-row" key={grant.id}><div><div className="grant-title"><strong>{profiles.find((profile) => profile.id === grant.user_id)?.full_name ?? profiles.find((profile) => profile.id === grant.user_id)?.email ?? 'Usuário não encontrado'}</strong><span className={grant.effect === 'allow' ? 'effect-allow' : 'effect-deny'}>{grant.effect === 'allow' ? 'Allow' : 'Deny'}</span></div><small>{permissions.find((permission) => permission.key === grant.permission_key)?.label ?? grant.permission_key}</small><small>{scopeLabel(grant)} · {grant.classification ?? 'Sem classificação'}</small><small>De {formatDate(grant.starts_at)}{grant.ends_at ? ` até ${formatDate(grant.ends_at)}` : ' · sem término'}</small><p>{grant.reason}</p></div><button className="grant-end-button" type="button" onClick={() => onEnd(grant)}>Encerrar</button></div>)}</div></article><article className="authorization-card permission-catalog"><h3>Catálogo de permissões</h3><p>Permissões ativas agrupadas por módulo.</p><div>{Object.entries(permissionsByModule).map(([module, items]) => <section className="permission-module" key={module}><h4>{module}</h4>{items.map((permission) => <div key={permission.key}><strong>{permission.label}</strong><small>{permission.description ?? permission.key}</small></div>)}</section>)}</div></article></div><article className="authorization-card grant-form-card"><h3>Nova concessão</h3><p>Somente administradores raiz podem registrar autorizações individuais.</p><form className="grant-form" onSubmit={onSubmit}><label>Usuário<select name="user_id" required defaultValue=""><option value="" disabled>Selecione o usuário</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name ?? profile.email ?? profile.id}{profile.email && profile.full_name ? ` — ${profile.email}` : ''}</option>)}</select></label><label>Permissão<select name="permission_key" required defaultValue=""><option value="" disabled>Selecione a permissão</option>{Object.entries(permissionsByModule).map(([module, items]) => <optgroup label={module} key={module}>{items.map((permission) => <option value={permission.key} key={permission.key}>{permission.label}</option>)}</optgroup>)}</select></label><label>Efeito<select name="effect" defaultValue="allow"><option value="allow">Allow — conceder</option><option value="deny">Deny — negar</option></select></label><label>Classificação de dado<select name="classification" defaultValue=""><option value="">Não especificada</option><option value="operational">Operacional</option><option value="personal">Pessoal</option><option value="financial">Financeira</option><option value="medical">Médica</option><option value="disciplinary">Disciplinar</option><option value="performance">Desempenho</option><option value="document">Documento</option></select></label><label>Escopo (opcional)<select name="scope" value={scope} onChange={(event) => onScopeChange(event.target.value as AuthorizationScope | '')}><option value="">Toda a empresa</option><option value="company">Empresa</option><option value="unit">Unidade</option><option value="area">Área</option><option value="team">Equipe</option><option value="person">Pessoa</option></select></label>{scope && <label>Alvo do escopo<select key={scope} name="scope_id" required defaultValue=""><option value="" disabled>Selecione {scope === 'person' ? 'a pessoa' : 'o escopo'}</option>{scopeOptions.map((item) => <option value={item.id} key={item.id}>{'full_name' in item ? item.full_name : item.name}</option>)}</select></label>}<label>Início<input name="starts_at" type="date" defaultValue={AUTHORIZATION_TODAY} required /></label><label>Fim (opcional)<input name="ends_at" type="date" min={AUTHORIZATION_TODAY} /></label><label className="grant-reason">Motivo<textarea name="reason" placeholder="Justificativa da concessão" required /></label><button type="submit">Registrar concessão</button></form></article></div></section>
}

function AuditModule({ logs, profiles, onRefresh, loading }: { logs: AuditLog[]; profiles: Profile[]; onRefresh: () => void; loading: boolean }) {
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const entities = [...new Set(logs.map((log) => log.entity_type))].sort()
  const actions = [...new Set(logs.map((log) => log.action))].sort()
  const origins = [...new Set(logs.map((log) => log.origin))].sort()
  const filteredLogs = logs.filter((log) => (!entityFilter || log.entity_type === entityFilter) && (!actionFilter || log.action === actionFilter) && (!originFilter || log.origin === originFilter))
  const actorLabel = (actorId: string | null) => {
    if (!actorId) return 'Sistema'
    const profile = profiles.find((item) => item.id === actorId)
    return profile?.full_name ?? profile?.email ?? 'Usuário não identificado'
  }
  const formatDateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  const formatAction = (action: string) => ({ insert: 'Criação', update: 'Atualização', delete: 'Exclusão' }[action] ?? action)
  return <section className="audit-section"><div className="section-heading"><div><p className="eyebrow">Auditoria administrativa</p><h2>Histórico de alterações</h2><p>Exibe até os 100 registros mais recentes disponíveis para administradores raiz, respeitando a RLS.</p></div><button className="outline-button" type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar'}</button></div><div className="audit-filters" aria-label="Filtros da auditoria"><label>Entidade<select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)}><option value="">Todas as entidades</option>{entities.map((entity) => <option value={entity} key={entity}>{entity}</option>)}</select></label><label>Ação<select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}><option value="">Todas as ações</option>{actions.map((action) => <option value={action} key={action}>{formatAction(action)}</option>)}</select></label><label>Origem<select value={originFilter} onChange={(event) => setOriginFilter(event.target.value)}><option value="">Todas as origens</option>{origins.map((origin) => <option value={origin} key={origin}>{origin}</option>)}</select></label></div><p className="audit-count">{filteredLogs.length} de {logs.length} registros carregados</p><div className="audit-timeline">{filteredLogs.length === 0 && <div className="audit-empty"><strong>Nenhum registro encontrado</strong><p>{logs.length === 0 ? 'Ainda não há eventos de auditoria disponíveis.' : 'Ajuste ou limpe os filtros para ver outros registros.'}</p></div>}{filteredLogs.map((log) => <article className="audit-log-row" key={log.id}><div className="audit-log-time"><strong>{formatDateTime(log.created_at)}</strong><span>{log.origin}</span></div><div className="audit-log-content"><div className="audit-log-title"><strong>{formatAction(log.action)}</strong><span className={`audit-action audit-action-${log.action}`}>{log.action}</span><span>{log.entity_type}</span></div><p>{log.request_summary?.trim() || `Alteração em ${log.entity_type}.`}</p><small>Ator: {actorLabel(log.actor_user_id)} · Entidade: {log.entity_id}</small></div><button className="audit-details-button" type="button" onClick={() => setSelectedLog(log)}>Detalhes</button></article>)}</div>{selectedLog && <div className="audit-details-backdrop" role="presentation" onMouseDown={() => setSelectedLog(null)}><section className="audit-details" role="dialog" aria-modal="true" aria-labelledby="audit-details-title" onMouseDown={(event) => event.stopPropagation()}><div className="audit-details-heading"><div><p className="eyebrow">Registro de auditoria</p><h3 id="audit-details-title">{formatAction(selectedLog.action)} em {selectedLog.entity_type}</h3></div><button type="button" className="text-button" onClick={() => setSelectedLog(null)}>Fechar</button></div><dl className="audit-meta"><div><dt>Data e hora</dt><dd>{formatDateTime(selectedLog.created_at)}</dd></div><div><dt>Ator</dt><dd>{actorLabel(selectedLog.actor_user_id)}</dd></div><div><dt>Origem</dt><dd>{selectedLog.origin}</dd></div><div><dt>Entidade</dt><dd>{selectedLog.entity_type} · {selectedLog.entity_id}</dd></div></dl><p className="audit-summary">{selectedLog.request_summary?.trim() || 'Sem resumo fornecido.'}</p><div className="audit-json-grid"><AuditJson title="Valores anteriores" value={selectedLog.old_values} /><AuditJson title="Valores novos" value={selectedLog.new_values} /></div></section></div>}</section>
}

function AuditJson({ title, value }: { title: string; value: unknown | null }) {
  const redact = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(redact)
    if (input && typeof input === 'object') return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([key, child]) => [key, /password|secret|token|api[_-]?key|authorization|credential|service[_-]?role/i.test(key) ? '[REDACTED]' : redact(child)]))
    return input
  }
  const rendered = value == null ? 'Sem valores registrados.' : JSON.stringify(redact(value), null, 2)
  return <section className="audit-json"><h4>{title}</h4><pre>{rendered}</pre></section>
}

function RecordList({ records, onRename, onToggle }: { records: Array<{ id: string; name: string; active: boolean; detail?: string }>; onRename: (record: { id: string; name: string; active: boolean }) => void; onToggle: (record: { id: string; name: string; active: boolean }) => void }) {
  if (records.length === 0) return <p className="empty-state">Nenhum cadastro criado ainda.</p>
  return <ul className="record-list">{records.map((record) => <li key={record.id}><div><strong>{record.name}</strong>{record.detail && <small>{record.detail}</small>}</div><div className="record-actions"><span className={record.active ? 'record-active' : 'record-inactive'}>{record.active ? 'Ativo' : 'Inativo'}</span><button type="button" onClick={() => onRename(record)}>Editar</button><button type="button" onClick={() => onToggle(record)}>{record.active ? 'Inativar' : 'Ativar'}</button></div></li>)}</ul>
}

export default App
