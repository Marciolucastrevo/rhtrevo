# Decisões Iniciais — Acesso, Permissões e Configuração Organizacional

**Projeto:** Plataforma de RH — Grupo Trevo  
**Data de referência:** 5 de agosto de 2026  
**Status:** Decisões de produto registradas para a primeira fase de evolução

## 1. Matriz de permissões configurável por usuário

**Decisão:** permissões não serão determinadas exclusivamente pelo cargo. Cada usuário poderá ter concessões e restrições específicas, em adição aos níveis de autonomia e aos vínculos organizacionais.

### Modelo de decisão

A autorização considera, nesta ordem:

1. usuário autenticado;
2. ação solicitada;
3. escopo do recurso (empresa, unidade, área, equipe, processo, carteira, pessoa ou tipo de dado);
4. permissões atribuídas diretamente ao usuário;
5. permissões concedidas pelo vínculo organizacional ou nível de autonomia;
6. bloqueios explícitos, que prevalecem sobre concessões genéricas;
7. vigência, delegação e requisitos de aprovação.

Assim, duas pessoas com o mesmo cargo podem ter acessos diferentes. Exemplo: dois gerentes de unidade podem gerir suas equipes, mas somente um possuir acesso à rotina financeira de uma unidade determinada.

## 2. Dados sensíveis seguem o mesmo padrão individual e contextual

**Decisão:** acesso a dados pessoais, médicos/atestados, remuneração, disciplinares, documentos pessoais, feedbacks e avaliações será configurável por usuário e escopo, sem herança automática por cargo ou relação funcional.

Cada concessão de dado sensível deve informar:

- categoria de dado;
- ação permitida: visualizar, registrar, editar, aprovar, exportar ou administrar;
- escopo de pessoas/empresas/unidades/áreas;
- vigência;
- concedente, justificativa e trilha de auditoria.

A regra default é de menor privilégio: sem concessão explícita, o dado não é mostrado.

## 3. Acesso inicial privado e administrador raiz

**Decisão:** durante consolidação, teste e validação, somente Lucas terá acesso à plataforma. Não haverá cadastro aberto, convite automático ou acesso de outros colaboradores até autorização posterior.

### Configuração inicial

- Criar um único usuário administrador raiz vinculado à conta de Lucas.
- Conceder acesso total à administração, configuração, testes e operação dos módulos.
- Registrar todas as ações no `audit_logs`, inclusive mudanças de permissões e estrutura.
- Desativar auto cadastro e convites para usuários comuns.
- Aplicar política de bloqueio por padrão: qualquer identidade não autorizada não acessa dados nem módulos.
- Manter chave `service_role` exclusivamente no backend; acesso total de Lucas não significa expor segredos ao navegador.

Antes de abertura para novos usuários, deve haver revisão de permissões, dados sensíveis, RLS, fluxos de convite e teste de isolamento entre usuários.

## 4. Organograma como painel de configuração por usuário

**Decisão:** o organograma será mais que uma visualização. Ele funcionará como ponto de entrada de um workflow de configuração de cada usuário.

### Fluxo administrativo proposto

1. Selecionar uma pessoa no organograma ou na lista de usuários.
2. Consultar seu perfil 360º e seus vínculos atuais.
3. Adicionar ou editar vínculos com empresas, unidades, áreas, equipes, processos, carteiras e pessoas.
4. Definir o tipo de relação: lotação, gestor direto, gestor secundário, responsável funcional, responsável técnico, aprovador, revisor, mentor, substituto ou ponto focal.
5. Atribuir responsabilidades específicas no vínculo.
6. Selecionar um nível de autonomia padrão e ajustar permissões por ação quando necessário.
7. Configurar acesso a categorias de dados sensíveis no escopo permitido.
8. Definir início, fim, justificativa e, quando aplicável, delegação temporária.
9. Simular as permissões resultantes e revisar o impacto antes de publicar.
10. Salvar a alteração com trilha de auditoria e atualização do grafo organizacional.

O organograma deve diferenciar visualmente relações formais, funcionais, responsabilidades e concessões de acesso; ele não deve sugerir que toda conexão equivale a poder hierárquico.

## 5. Migração somente após validação completa

**Decisão:** migrações de dados reais serão realizadas depois que o sistema estiver funcionalmente testado e validado pelo administrador raiz.

### Fase inicial

- Utilizar dados de teste, dados mínimos controlados ou cadastros manuais para validar os fluxos.
- Criar modelos de importação, validação e relatório de inconsistências sem executar carga produtiva ampla.
- Não ativar integrações produtivas antes da validação de estrutura, acessos, documentos e processos.

### Pré-requisitos para migrar

1. Estrutura organizacional e cadastro de usuários validados.
2. Matriz de permissões por usuário testada em cenários críticos.
3. RLS, auditoria, Storage e tratamento de dados sensíveis revisados.
4. Modelo de importação com prévia, validação, idempotência, rollback viável e relatório de erro.
5. Plano de migração aprovado, com backup/origem preservada e lote piloto concluído.

## 6. Critérios de aceite da primeira fase

A primeira fase estará atendida quando Lucas puder, sozinho e sem alteração de código:

- administrar empresas, unidades, áreas, equipes, cargos e pessoas;
- selecionar uma pessoa e configurar seus vínculos com outras pessoas e estruturas;
- atribuir responsabilidades e permissões específicas para cada vínculo;
- controlar individualmente acesso a dados sensíveis;
- simular o que um usuário poderia visualizar ou executar antes de liberar acesso;
- visualizar o histórico e a justificativa de cada mudança;
- usar a plataforma em ambiente privado, com acesso total próprio e nenhum acesso de terceiros;
- testar os fluxos com dados controlados antes de qualquer migração produtiva.
