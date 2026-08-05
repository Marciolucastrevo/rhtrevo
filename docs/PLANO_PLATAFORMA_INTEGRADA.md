# RHTrevo — Construção Integrada da Plataforma

## Regra de execução

Os dados já importados (empresas, unidades, áreas, cargos, pessoas e vínculos de origem) permanecem como base controlada. Não haverá configuração definitiva de complementos, permissões ou movimentações enquanto a plataforma integrada não estiver pronta para homologação.

## Núcleo transversal

Antes de configurar a operação, todos os módulos devem usar as mesmas regras de:

1. identidade e autenticação;
2. autorização explícita por usuário, ação, escopo e vigência;
3. classificação de dados sensíveis;
4. vínculo organizacional e responsabilidade;
5. histórico, auditoria e reversibilidade;
6. navegação consistente e mensagens de confirmação/erro.

## Módulos de entrega

### 1. Estrutura organizacional
- Empresas, unidades, áreas, equipes e cargos.
- Organograma navegável e editável.
- Relações entre estrutura formal e atuação funcional.

### 2. Pessoas e vínculos
- Cadastro único de pessoa.
- Vínculo principal de registro e vínculos complementares.
- Gestão de função, área, unidade, vigência, gestores e responsáveis.
- Histórico sem sobrescrever vínculos anteriores.

### 3. Responsabilidades e autorizações
- Catálogo de responsabilidades e ações do sistema.
- Níveis de autonomia.
- Concessões por usuário, escopo, classificação de dados e vigência.
- Simulação de acesso antes de ativação definitiva.

### 4. Fluxos operacionais
- Solicitações, aprovações, delegações e responsáveis por processo.
- Janelas de vínculo e autorização abertas a partir de cada função/módulo.
- Alertas e pendências de configuração.

### 5. Auditoria e administração
- Registro de alterações administrativas.
- Linha do tempo por pessoa, vínculo e autorização.
- Visualização de erros, validações e regras bloqueadoras.

## Homologação

A homologação começa somente após os módulos compartilharem o mesmo motor de autorização, vínculo e auditoria. A base atual será usada para cenários de teste, sem conversão para configuração operacional definitiva até o aceite do administrador raiz.
