# Modelo de Cadastros, Vínculos e Autonomias Configuráveis

**Projeto:** Plataforma de RH — Grupo Trevo  
**Objetivo:** permitir que a plataforma represente empresas, unidades, áreas, pessoas e relações de trabalho reais sem impor uma hierarquia rígida ou permissões inferidas por cargo.

## 1. Princípio de modelagem

A plataforma começa com cadastros organizacionais configuráveis. Depois, cada pessoa é conectada às entidades e a outras pessoas por meio de **vínculos explícitos**. É no vínculo — e não apenas no cargo — que se define a atuação, o escopo, as responsabilidades e as autonomias aplicáveis.

**Regra:** cargo descreve uma posição; vínculo descreve como, onde e com quais poderes a pessoa atua.

## 2. Cadastros-base administráveis

Essas entidades devem possuir CRUD, status ativo/inativo, vigência, auditoria e configuração de responsáveis:

| Cadastro | Finalidade | Exemplos |
|---|---|---|
| Empresa | Pessoa jurídica ou empresa do grupo | Grupo Trevo, empresa operacional, TRR |
| Unidade | Local ou operação vinculada a uma empresa | Posto, base, matriz, filial |
| Área | Domínio organizacional ou técnico | Financeiro, Pessoas, Logística, SGI, Manutenção |
| Subárea/equipe | Recorte operacional de uma área | Caixas, Pista, Frota, Recrutamento |
| Cargo | Posição de trabalho e referência de responsabilidades | Gerente de unidade, motorista, chefe de caixa |
| Processo | Fluxo operacional que pode ter donos e participantes | Fechamento, abastecimento, admissão |
| Carteira | Conjunto controlado de pessoas, veículos, documentos ou demandas | Motoristas da base, documentos de frota |
| Tipo de relação | Vocabulário configurável de vínculos | Gestor direto, responsável funcional, revisor, mentor, aprovador |
| Responsabilidade | Tema ou dever atribuível | Jornada, manutenção, abastecimento, documentação, RH, SGI |
| Nível de autonomia | Conjunto reutilizável de ações permitidas | Consulta, operação, gestão, aprovação, administração |

A administração pode criar, editar, inativar e organizar esses cadastros conforme a evolução da operação, preservando histórico para vínculos antigos.

## 3. Vínculos de pessoas com a organização

Uma pessoa poderá ter vários vínculos ativos simultaneamente. Cada vínculo contém, no mínimo:

- pessoa vinculada;
- tipo de vínculo;
- empresa, unidade, área, equipe, processo ou carteira de escopo;
- cargo quando aplicável;
- responsável/gestor associado quando aplicável;
- data de início e fim;
- marcação de vínculo principal quando fizer sentido;
- status;
- observação e documento de suporte, quando necessário.

### Exemplos

| Pessoa | Tipo de vínculo | Escopo | Papel no vínculo |
|---|---|---|---|
| Chefe de caixa | Lotação/atuação | Posto Trevo → Caixas | Chefe da equipe de caixas |
| Chefe de caixa | Relação funcional | Financeiro & Custos | Interface de rotina financeira |
| Gerente financeira | Responsável funcional | Posto Trevo → Caixa | Acompanha indicadores e rotinas autorizadas |
| Motorista | Lotação/atuação | Transportes → Base | Motorista vinculado à operação |
| Responsável de manutenção | Carteira técnica | Motoristas e veículos definidos | Atendimento de manutenção |
| Profissional de RH | Carteira de pessoas | Motoristas definidos | Documentos e processos de RH |

Nenhum desses vínculos, por si só, concede acesso a dados ou poder de alteração. A autonomia é definida em camada própria.

## 4. Relações entre pessoas

Além dos vínculos com estrutura, deve existir um cadastro de relações pessoa-a-pessoa, com tipo, direção, escopo e vigência.

### Tipos iniciais sugeridos

- gestor direto;
- gestor secundário;
- responsável funcional;
- responsável técnico;
- aprovador;
- revisor/conferente;
- mentor;
- substituto/delegado;
- ponto focal;
- interface de área.

Cada relação deve informar se é somente informativa, de acompanhamento, de consulta, de execução, de aprovação ou de gestão de pessoas. Essa classificação orienta as permissões possíveis, mas não substitui a permissão explícita.

## 5. Autonomias e acessos no vínculo

O painel de cada vínculo deve permitir adicionar uma ou mais concessões de autonomia:

| Campo | Exemplo |
|---|---|
| Ação/capacidade | `tasks.create`, `attendance.view`, `documents.request_signature` |
| Escopo | Empresa, unidade, área, processo, carteira, pessoa ou tipo de dado |
| Nível | Visualizar, executar, gerir, aprovar ou administrar |
| Dados permitidos | Operacional, pessoal, financeiro, médico, disciplinar, desempenho |
| Vigência | Permanente ou com data de expiração |
| Concedente e motivo | Quem autorizou e justificativa |
| Limites adicionais | Somente próprios, somente carteira, exige dupla aprovação etc. |

A UI deve disponibilizar alternativas simples para a administração: aplicar um nível de autonomia pré-configurado ou personalizar ações específicas quando houver exceção.

## 6. Ordem de cadastro para implantação

1. Criar empresas e unidades.
2. Criar áreas, subáreas/equipes e processos.
3. Criar catálogo de cargos, tipos de relação, responsabilidades e níveis de autonomia.
4. Cadastrar/importar pessoas.
5. Criar vínculos de lotação e atuação de cada pessoa.
6. Configurar gestores e relações funcionais.
7. Atribuir carteiras de responsabilidade.
8. Aplicar autonomias por vínculo e por escopo.
9. Simular acessos e revisar com os donos de área.
10. Publicar a estrutura e revisar periodicamente.

## 7. Telas administrativas necessárias

### Estrutura organizacional
- Árvore de empresas → unidades → áreas → equipes.
- Filtros por status e vigência.
- Histórico de alterações e responsáveis.

### Perfil 360º da pessoa
- Vínculos ativos e históricos.
- Gestores formais e relações funcionais em blocos separados.
- Áreas, unidades, carteiras, processos e responsabilidades.
- Autonomias concedidas diretamente e herdadas de níveis autorizados.
- Explicação de acesso: “o que pode fazer, onde pode fazer e por qual vínculo”.

### Matriz de acessos
- Visualização por pessoa, empresa, unidade, área, processo ou ação.
- Simulador: dado um usuário e uma ação, informar permitido/negado e a regra aplicada.
- Delegações próximas do vencimento, conflitos e concessões sem escopo.

## 8. Administração dinâmica e mudanças organizacionais

Empresas, unidades, áreas, equipes, cargos, pessoas, relações, carteiras, responsabilidades e autonomias devem ser editáveis dentro do software por usuários autorizados. A configuração inicial apenas inaugura a estrutura; ela não congela a operação.

### Operações administrativas necessárias

- criar, editar, reordenar, ativar, inativar e arquivar cadastros organizacionais;
- transferir uma pessoa entre unidades ou áreas, preservando vínculos anteriores;
- adicionar ou remover gestores e relações funcionais com data de vigência;
- alterar responsabilidades e carteiras sem modificar o cargo da pessoa;
- conceder, reduzir, revogar ou programar autonomias e delegações;
- duplicar uma estrutura de área/equipe quando uma nova unidade for aberta;
- consultar o histórico completo de cada alteração e desfazer mudanças permitidas.

### Regras para alterações seguras

1. **Vigência em vez de sobrescrita:** mudança de unidade, gestor, escopo ou autonomia registra data de início e encerra o vínculo anterior; tarefas, avaliações, documentos e auditoria preservam o contexto histórico.
2. **Inativação preferencial:** empresa, área, cargo ou usuário com histórico não deve ser apagado de forma definitiva; fica inativo para novos vínculos e permanece consultável conforme permissão.
3. **Impacto visível antes de confirmar:** ao editar ou remover uma entidade, a interface informa quantas pessoas, vínculos, processos e permissões serão afetados.
4. **Permissões críticas controladas:** alterações em acessos sensíveis exigem o nível administrativo apropriado, justificativa e auditoria; se definido pela política, passam por aprovação de outro administrador.
5. **Revisão de conflitos:** o sistema alerta sobre vínculos sem escopo, dois gestores principais, concessões vencidas, carteiras sem responsável ou permissões incompatíveis.
6. **Publicação planejada:** mudanças relevantes podem ser salvas como rascunho e ativadas em data futura, útil para transferências, admissões, desligamentos e reorganizações.

Dessa forma, RH e gestores autorizados conseguem adaptar a estrutura no dia a dia, enquanto a plataforma mantém consistência, segurança e rastreabilidade.

## 9. Regras de segurança e integridade

1. Relações e cargos não criam permissões automaticamente.
2. Ações de RH, disciplinares, médicas, financeiras e de remuneração exigem concessão específica e nunca são herdadas apenas de uma relação funcional.
3. Um vínculo deve possuir ao menos um escopo e uma vigência.
4. A exclusão de entidade ou vínculo deve preservar histórico e auditoria; preferir inativação.
5. Mudanças de autonomia são auditadas com concedente, motivo, escopo, antes/depois e data.
6. Toda regra usada na UI também deve ser aplicada no banco/RLS e server functions.
7. O G4 OS consulta a mesma decisão de autorização e pode explicar o motivo da negativa sem expor informação protegida.

## 10. Critério de aceite desta fundação

Esta fundação estará atendida quando um administrador conseguir cadastrar e alterar uma empresa/unidade/área, adicionar ou transferir pessoas, conectá-las a múltiplas estruturas e pessoas, definir responsabilidades e conceder/revogar acessos diferentes por vínculo; e quando a plataforma demonstrar, por simulação e teste, que cada usuário só enxerga e executa o que lhe foi explicitamente autorizado, sem apagar o contexto histórico de mudanças anteriores.
