import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type ConnectionState = 'checking' | 'ready' | 'unavailable'

type RootRole = {
  role: string
  active: boolean
}

const foundations = [
  ['Estrutura organizacional', 'Empresas, unidades, áreas, equipes e cargos editáveis'],
  ['Vínculos e organograma', 'Relações formais, funcionais e responsabilidades por pessoa'],
  ['Acessos por usuário', 'Autonomias e dados sensíveis definidos por ação e escopo'],
  ['Auditoria e segurança', 'Histórico de mudanças e acesso negado por padrão'],
]

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    isSupabaseConfigured ? 'checking' : 'unavailable',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [roles, setRoles] = useState<RootRole[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data, error }) => {
      setSession(data.session)
      setConnectionState(error ? 'unavailable' : 'ready')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      setRoles([])
      return
    }

    void supabase
      .from('user_roles')
      .select('role, active')
      .eq('user_id', session.user.id)
      .eq('active', true)
      .then(({ data }) => setRoles((data ?? []) as RootRole[]))
  }, [session])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setAuthError(null)
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsSubmitting(false)
    if (error) setAuthError('Não foi possível entrar. Confira o e-mail e a senha.')
  }

  async function handleLogout() {
    await supabase?.auth.signOut()
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">RHTrevo</p>
          <h1>Configuração pendente</h1>
          <p>Informe a URL e a chave publicável do Supabase no ambiente local para iniciar.</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="auth-shell">
        <form className="auth-card" onSubmit={handleLogin}>
          <p className="eyebrow">Grupo Trevo</p>
          <h1>Acesso privado</h1>
          <p>Entre com a conta administrativa criada para o ambiente de desenvolvimento.</p>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {authError && <p className="form-error">{authError}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </main>
    )
  }

  const isRootAdmin = roles.some((role) => role.role === 'root_admin')

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Grupo Trevo</p>
          <h1>RHTrevo</h1>
        </div>
        <div className="header-actions">
          <span className={`status status-${connectionState}`}>
            {connectionState === 'checking' && 'Verificando ambiente'}
            {connectionState === 'ready' && 'Ambiente de desenvolvimento conectado'}
            {connectionState === 'unavailable' && 'Configuração pendente'}
          </span>
          <button className="text-button" type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Fundação administrativa</p>
        <h2 id="page-title">Plataforma privada em preparação</h2>
        <p>
          A primeira entrega estabelece a estrutura organizacional, os vínculos
          entre pessoas e as permissões configuráveis por usuário — antes da
          migração de qualquer dado real.
        </p>
      </section>

      <section className="admin-state" aria-label="Estado do acesso atual">
        <div>
          <p className="eyebrow">Usuário autenticado</p>
          <strong>{session.user.email}</strong>
          <p>{isRootAdmin ? 'Administrador raiz ativo' : 'Acesso sem papel administrativo ativo'}</p>
        </div>
        <span className={isRootAdmin ? 'private-badge' : 'warning-badge'}>
          {isRootAdmin ? 'root_admin' : 'Revisar acesso'}
        </span>
      </section>

      <section className="foundation-grid" aria-label="Fundamentos da primeira entrega">
        {foundations.map(([title, description], index) => (
          <article className="foundation-card" key={title}>
            <span className="card-index">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="next-step">
        <div>
          <p className="eyebrow">Próximo marco</p>
          <h2>Configurar a estrutura organizacional</h2>
          <p>
            Empresas, unidades, áreas, pessoas e relações serão cadastradas e
            geridas no próprio software, com histórico e permissões por vínculo.
          </p>
        </div>
        <span className="private-badge">Acesso privado</span>
      </section>
    </main>
  )
}

export default App
