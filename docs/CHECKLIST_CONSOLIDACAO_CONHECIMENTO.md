# Checklist Mestre de Consolidação do Conhecimento

**Projeto:** Plataforma de RH — Grupo Trevo  
**Data de referência:** 5 de agosto de 2026  
**Regra de governança:** nenhuma etapa avança para “concluída” sem evidência registrada e validação explícita de que atende à necessidade operacional.

## Como usaremos este checklist

- **Não iniciado:** ainda não há evidência suficiente.
- **Em levantamento:** existem insumos, mas faltam validação, exceções ou responsável.
- **Em validação:** conteúdo estruturado está pronto para revisão do dono de negócio.
- **Concluído e aceito:** necessidade atendida, evidência arquivada e impacto registrado.
- **Ajuste necessário:** a validação identificou lacuna; o item volta para levantamento com pendência descrita.

Em cada etapa, a confirmação deve responder: **“temos informação suficiente, atual e aprovada para construir, operar e testar este domínio sem depender de suposições?”**

---

## Etapa 1 — Estrutura organizacional e relações de trabalho

**Objetivo:** representar o Grupo Trevo como ele opera de fato, distinguindo hierarquia, relações funcionais e autonomia.

### Checklist

- [ ] **1.1 Empresas e unidades:** listar empresas, postos, TRRs, transportes, bases, matriz e demais unidades; incluir identificador, localidade, status e responsável.
- [ ] **1.2 Áreas e subáreas:** validar áreas corporativas e operacionais, incluindo financeiro/custos, receita, compras, marketing, pessoas, jurídico, TI, compliance, auditoria, manutenção, logística, abastecimento, documentação, RH e SGI.
- [ ] **1.3 Estrutura formal:** registrar, por pessoa, cargo, empresa/unidade, gestor principal, gestores secundários e vigência do vínculo.
- [ ] **1.4 Relações funcionais:** mapear coordenação técnica, interfaces entre áreas e responsabilidades compartilhadas que não representam subordinação.
- [ ] **1.5 Carteiras de responsabilidade:** identificar quem cuida de quais pessoas, veículos, documentos, rotinas, processos e candidatos.
- [ ] **1.6 Exceções e delegações:** registrar substituições, responsáveis temporários, alçadas e datas de expiração.
- [ ] **1.7 Organograma validado:** comparar o modelo estruturado com o organograma oficial e corrigir divergências.

### Critério de aceite

- Para qualquer colaborador, é possível responder: onde atua, a quem responde, quem possui responsabilidade funcional sobre ele e quem pode agir sobre seus dados/processos — sem inferir autoridade apenas pela conexão organizacional.

### Evidência atual

- PDF anexado: `Ultima atualização organograma (2).pdf` (13 páginas).
- Leitura preliminar identificou camadas e termos como Co-Executivo, Corporativo & Pessoas, Financeiro & Custos, Receita, Postos, Compras, Marketing, TRRs, Transportes, Financeiro, Pessoas, Jurídico, TI, Compliance e Auditoria, além de papéis de unidade, pista, caixa, logística, manutenção, RH, SGI e financeiro.
- Modelo proposto de cadastro e ligação: `MODELO_CADASTROS_VINCULOS_E_AUTONOMIAS.md`.
- Decisões de configuração por usuário e organograma operacional: `DECISOES_INICIAIS_ACESSO_E_CONFIGURACAO.md`.
- **Status atual: Em levantamento.** O anexo é base importante, mas ainda é necessário transformar os relacionamentos visuais em registros estruturados e validar vigência, unidades, múltiplos vínculos e exceções.

---

## Etapa 2 — Pessoas, cargos e responsabilidades

**Objetivo:** garantir que cada cargo e pessoa tenha contexto operacional suficiente para uso da plataforma e do G4 OS.

### Checklist

- [ ] **2.1 Cadastro mestre de pessoas:** colaboradores, terceiros, candidatos e usuários; identificadores, situação, empresa/unidade e vínculos.
- [ ] **2.2 Catálogo de cargos:** nome, CBO quando aplicável, área, nível, objetivo, requisitos e empresas/unidades permitidas.
- [ ] **2.3 Descrições de cargo:** missão, responsabilidades, limites, indicadores, documentos e treinamentos obrigatórios.
- [ ] **2.4 Matriz RACI/processos:** quem executa, aprova, consulta e deve ser informado em cada processo crítico.
- [ ] **2.5 Conhecimento oficial:** manuais, políticas e procedimentos vinculados a cargo, área e unidade.
- [ ] **2.6 Dados sensíveis:** classificar informações pessoais, médicas, financeiras, disciplinares e de desempenho.

### Critério de aceite

- A plataforma e o G4 OS conseguem informar, com fonte oficial, o que cada pessoa deve fazer, quais processos se aplicam e quais informações pode acessar.

**Status atual: Não iniciado.**

---

## Etapa 3 — Matriz de permissões, acessos e autonomias

**Objetivo:** transformar a regra de ação + escopo em uma matriz configurável e auditável.

### Checklist

- [ ] **3.1 Catálogo de ações:** listar todas as ações de consulta, criação, edição, aprovação, exclusão, exportação e administração por módulo.
- [ ] **3.2 Escopos reutilizáveis:** empresas, unidades, áreas, equipes, processos, projetos, carteiras, pessoas e tipos de dado.
- [ ] **3.3 Níveis de autonomia:** definir permissões padrão e o que cada nível permite por ação.
- [ ] **3.4 Concessões individuais:** formalizar exceções sem alterar cargos ou papéis globais.
- [ ] **3.5 Delegações temporárias:** concedente, beneficiário, motivo, escopo, início e fim.
- [ ] **3.6 Restrições explícitas:** bloqueios para dados e ações sensíveis, com prioridade sobre permissões genéricas.
- [ ] **3.7 Revisão e simulação:** visualizar “por que possui acesso?”, simular mudanças e revisar concessões vencidas.
- [ ] **3.8 Testes de RLS e interface:** validar que backend, API, UI e G4 OS tomam a mesma decisão de acesso.

### Critério de aceite

- Para cada ação crítica, é possível explicar e reproduzir por teste quem pode realizá-la, em que escopo e por qual concessão.

**Status atual: Em validação de desenho.** A arquitetura, o modelo de vínculos e a decisão de permissões individuais foram definidos; ainda falta converter a operação real em matriz inicial aprovada e testá-la no sistema.

---

## Etapa 4 — Processos, rotinas, tarefas e evidências

**Objetivo:** registrar como o trabalho acontece, quem é responsável e quais comprovações são necessárias.

### Checklist

- [ ] **4.1 Inventário de processos:** listar processos por área e unidade, com dono, frequência e criticidade.
- [ ] **4.2 Fluxo de cada processo prioritário:** entrada, etapas, responsável, aprovação, prazo, saída e exceções.
- [ ] **4.3 Rotinas recorrentes:** frequência, gatilho, responsável, revisor, checklist e escalonamento.
- [ ] **4.4 Evidências:** anexos, fotos, assinaturas, checklists, registros de reunião e retenção.
- [ ] **4.5 Reuniões e feedbacks:** pauta, participantes, gravação/transcrição, tarefas derivadas e limites de uso disciplinar.
- [ ] **4.6 Indicadores e alertas:** o que deve ser acompanhado, por quem e quando notificar.

### Critério de aceite

- Os fluxos priorizados podem ser executados de ponta a ponta na plataforma, inclusive quando há atraso, devolução, revisor, evidência ou exceção.

**Status atual: Parcialmente consolidado.** Tarefas, processos, checklists, recorrência, reuniões e conferência já possuem especificação; faltam inventário de processos reais e validação com os donos de área.

---

## Etapa 5 — Dados, documentos, LGPD e retenção

**Objetivo:** garantir que documentos e dados sejam importados, classificados, acessados e retidos corretamente.

### Checklist

- [ ] **5.1 Catálogo de documentos:** tipo, proprietário, obrigatoriedade, validade, assinatura, acesso e retenção.
- [ ] **5.2 Holerites e assinatura:** lote, destinatários, status de assinatura, notificações e prova de aceite.
- [ ] **5.3 Atestados e saúde:** fluxo restrito, classificação, acessos mínimos e prazo de guarda.
- [ ] **5.4 Política de dados:** classificação, base de tratamento, compartilhamento, descarte e resposta a incidentes.
- [ ] **5.5 Importações:** modelos CSV/XLSX, chaves de vínculo, prévia, validação, relatório e reversão.
- [ ] **5.6 Leitura de arquivos:** OCR, extração, sugestão de metadados e confirmação humana antes do vínculo final.

### Critério de aceite

- Todo documento possui tipo, dono, acesso, origem, histórico e regra de retenção; dados sensíveis não ficam expostos por permissões genéricas.

**Status atual: Em planejamento.** Arquitetura de importação e leitura foi definida; catálogo e política ainda precisam ser validados.

---

## Etapa 6 — Módulos de RH pendentes e regras de negócio

**Objetivo:** fechar requisitos e critérios de aceite antes de implementar novas frentes.

### Checklist

- [ ] **6.1 Documentos, holerites e assinatura digital.**
- [ ] **6.2 Faltas, atrasos, jornada e atestados.**
- [ ] **6.3 Comunicados e aniversariantes.**
- [ ] **6.4 Contratação, admissão, desligamento e aprovações.**
- [ ] **6.5 Recrutamento e seleção.**
- [ ] **6.6 Treinamentos, trilhas, certificados e ranking.**
- [ ] **6.7 Pesquisas de clima e confidencialidade.**
- [ ] **6.8 Integração nativa com G4 OS por capacidade e permissão.**

Para cada item acima, registrar: objetivo, atores, fluxo principal, exceções, dados, permissões, notificações, integrações, telas, critérios de aceite e cenários de teste.

### Critério de aceite

- Nenhum módulo novo começa por suposição: há especificação aprovada, regras de acesso, dados mínimos, fluxo de exceção e teste de aceite definido.

**Status atual: Em planejamento.**

---

## Etapa 7 — Integrações, API e operação sem conectores

**Objetivo:** documentar fontes atuais, usar importações no início e conectar sistemas de forma segura quando validados.

### Checklist

- [ ] **7.1 Inventário de sistemas e planilhas existentes.**
- [ ] **7.2 Mapa de dados:** origem, destino, frequência, dono, chave de vínculo e risco.
- [ ] **7.3 API sandbox:** autenticação, escopos, exemplos, webhooks e logs de teste.
- [ ] **7.4 Painel de conectores:** estados disabled/sandbox/configured/active/error.
- [ ] **7.5 Relógio de ponto:** contrato de importação primeiro; integração oficial depois.
- [ ] **7.6 Notificações:** canais, destinatários, conteúdo permitido e regras de conformidade.
- [ ] **7.7 Idempotência e reprocessamento:** garantir que eventos e importações não dupliquem dados.

### Critério de aceite

- A plataforma opera integralmente sem conectores e cada integração pode ser ativada, monitorada, interrompida e reprocessada sem perda de rastreabilidade.

**Status atual: Em planejamento.**

---

## Etapa 8 — Estado técnico, segurança e qualidade

**Objetivo:** assegurar que o produto existente é compreendido, seguro e evoluível.

### Checklist

- [ ] **8.1 Inventário do repositório e rotas.**
- [ ] **8.2 Inventário do banco:** migrations, tabelas, enums, índices, funções, triggers, GRANTs e RLS.
- [ ] **8.3 Storage:** buckets, políticas, retenção, upload e download.
- [ ] **8.4 Segredos e ambientes:** desenvolvimento, teste, produção, rotação e acesso.
- [ ] **8.5 Auditoria e observabilidade:** logs, erros, correlação, alertas e trilha por entidade.
- [ ] **8.6 Plano de testes:** fluxos críticos, permissões, regressão e dados de teste.
- [ ] **8.7 Backup, recuperação e continuidade.**
- [ ] **8.8 Documentação de deploy e reversão.**

### Critério de aceite

- Uma equipe técnica consegue reproduzir o ambiente, explicar o modelo de segurança, publicar uma mudança e recuperar uma falha sem depender de conhecimento informal.

**Status atual: Não iniciado.** Depende de acesso ao repositório Lovable e ao projeto Supabase.

---

## Etapa 9 — Piloto, validação e melhoria contínua

**Objetivo:** confirmar que o conhecimento documentado corresponde à operação real antes de escalar.

### Checklist

- [ ] **9.1 Selecionar áreas/unidades piloto e usuários-chave.**
- [ ] **9.2 Escolher de três a cinco fluxos críticos para piloto.**
- [ ] **9.3 Treinar usuários e registrar dúvidas recorrentes.**
- [ ] **9.4 Executar cenários normais e exceções.**
- [ ] **9.5 Corrigir lacunas de processo, permissão, dado e interface.**
- [ ] **9.6 Formalizar aceite do piloto e plano de expansão.**
- [ ] **9.7 Revisão quinzenal de decisões, métricas, acessos e backlog.**

### Critério de aceite

- Usuários-chave executam os fluxos sem planilhas paralelas ou intervenção técnica indevida, e as melhorias do piloto foram incorporadas à documentação e ao backlog.

**Status atual: Não iniciado.**

---

## Controle de validações

| Etapa | Estado | Evidência atual | Próxima confirmação necessária |
|---|---|---|---|
| 1. Estrutura organizacional | Em levantamento | Organograma PDF de 13 páginas + modelo de cadastros/vínculos | Validar empresas/unidades, vínculos, gestores e relações funcionais estruturadas |
| 2. Pessoas e cargos | Não iniciado | Especificação existente de cargos/pessoas | Validar catálogo e descrições de cargos |
| 3. Permissões e autonomias | Em validação de desenho | Arquitetura, modelo de vínculos e decisão de acesso individual | Aprovar primeira matriz operacional e validá-la por simulação |
| 4. Processos e rotinas | Parcialmente consolidado | Especificação das fases 1–13 | Inventariar e validar processos reais prioritários |
| 5. Dados e documentos | Em planejamento | Arquitetura de importação e leitura | Aprovar catálogo documental e LGPD |
| 6. Módulos pendentes | Em planejamento | Lista de módulos futuros | Especificar e priorizar o primeiro módulo |
| 7. Integrações e API | Em planejamento | Arquitetura sandbox e conectores | Inventariar sistemas e arquivos atuais |
| 8. Técnica e segurança | Não iniciado | Resumo técnico das fases anteriores | Acessar e auditar código/Supabase |
| 9. Piloto | Não iniciado | — | Escolher unidade/área e fluxos piloto |
