import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './App.css'

type ConnectionState = 'checking' | 'ready' | 'unavailable'

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

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ error }) => {
      setConnectionState(error ? 'unavailable' : 'ready')
    })
  }, [])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Grupo Trevo</p>
          <h1>RHTrevo</h1>
        </div>
        <span className={`status status-${connectionState}`}>
          {connectionState === 'checking' && 'Verificando ambiente'}
          {connectionState === 'ready' && 'Ambiente de desenvolvimento conectado'}
          {connectionState === 'unavailable' && 'Configuração pendente'}
        </span>
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
          <h2>Configurar o administrador raiz e o modelo de acesso</h2>
          <p>
            O acesso seguirá o princípio de menor privilégio: relações de
            trabalho não geram autonomia automaticamente, e toda concessão
            terá escopo, vigência e auditoria.
          </p>
        </div>
        <span className="private-badge">Acesso privado</span>
      </section>
    </main>
  )
}

export default App
