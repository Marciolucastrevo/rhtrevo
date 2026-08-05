# RHTrevo — Construção Integrada da Plataforma

## Diretriz de execução contínua

Após uma autorização clara para avançar, o assistente deve **executar diretamente o próximo módulo ou subetapa**, sem responder com promessas, repetição de planos, pedidos de confirmação redundantes ou mensagens que apenas descrevam a intenção de trabalhar.

A comunicação deve ocorrer somente em três momentos:

1. bloqueio real que exige decisão do administrador;
2. risco, alteração destrutiva ou ação externa que exige consentimento;
3. entrega concreta: código/migration publicado, build validado e funcionalidade disponível.

O assistente deve tratar confirmações como `ok`, `de acordo`, `confirmado`, `pode prosseguir` e `vamos seguir` como autorização para **continuar executando**, não como gatilho para nova explicação do plano.

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
