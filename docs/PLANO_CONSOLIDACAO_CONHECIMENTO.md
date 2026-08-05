# Plano de Consolidação do Conhecimento — Plataforma de RH

**Projeto:** Plataforma de RH — Grupo Trevo  
**Data de referência:** 5 de agosto de 2026  
**Objetivo:** transformar decisões, regras de operação, especificações, código e aprendizados em uma base única, pesquisável e atualizável para sustentar a evolução da plataforma.

## 1. O que já está consolidado

- Histórico funcional da plataforma até as fases 1–13, incluindo Pessoas, Tarefas, Processos, Checklists, Reuniões, Agenda, Desempenho, Metas, Organograma e autonomia.
- Regras de negócio críticas: múltiplos gestores e empresas, participantes de ciclos, metas somente leitura para o colaborador, recorrências, RLS e auditoria.
- Arquitetura futura de integração G4 OS, API, importações, conectores e modelo adaptável de permissões.

## 2. Lacunas a consolidar antes de ampliar o produto

1. Estado real do código, banco de dados, migrations, buckets, secrets e deployment atual.
2. Modelo organizacional atual do Grupo Trevo: empresas, unidades, áreas, operações, responsáveis e relações transversais.
3. Catálogo de cargos, descrições, responsabilidades, CBO, documentos e processos associados.
4. Matriz de permissões desejada por ação e escopo, incluindo exceções e delegações.
5. Sistemas e arquivos de origem: ponto, documentos, holerites, assinaturas, recrutamento, treinamentos, planilhas e mensageria.
6. Fluxos operacionais que devem ser digitalizados primeiro, com responsáveis e critérios de conclusão.
7. Dados que exigem classificação especial: saúde/atestados, documentos pessoais, remuneração, informações disciplinares e avaliações.

## 3. Base de conhecimento do projeto

Manter uma pasta de documentação no repositório da plataforma, preferencialmente `docs/`, com os documentos abaixo. Cada documento deve ter responsável, data de atualização e link para decisões relacionadas.

| Artefato | Conteúdo essencial | Manutenção |
|---|---|---|
| `README_PRODUTO.md` | Visão do produto, público, objetivos, módulos, limites e visão de futuro | Produto / direção |
| `ESPECIFICACAO_FUNCIONAL.md` | Comportamento de cada módulo, telas, fluxos e regras de negócio | Produto + desenvolvimento |
| `MODELO_ORGANIZACIONAL.md` | Empresas, unidades, áreas, equipes, hierarquia e relações funcionais | RH / operações |
| `MATRIZ_DE_AUTONOMIA.md` | Ações, níveis, escopos, exceções, dados sensíveis e regras de delegação | RH + administração |
| `GLOSSARIO.md` | Definições oficiais: unidade, gestor principal, responsável funcional, carteira, ocorrência, processo, rotina etc. | Produto |
| `MODELO_DE_DADOS.md` | Entidades, relações, enums, constraints, RLS e dicionário de campos | Desenvolvimento |
| `ARQUITETURA_TECNICA.md` | Stack, rotas, server functions, Supabase, storage, segurança, deployment e observabilidade | Desenvolvimento |
| `API_E_INTEGRACOES.md` | Contratos de API, sandbox, webhooks, conectores, imports e mapa de sistemas | Tecnologia / operações |
| `CATALOGO_DE_PROCESSOS.md` | Processos, etapas, prazos, responsáveis, entradas, saídas e evidências | Donos de processo |
| `CATALOGO_DE_DOCUMENTOS.md` | Tipos documentais, obrigatoriedade, validade, retenção, acesso e assinatura | RH / jurídico |
| `POLITICA_DE_DADOS.md` | Classificação, LGPD, retenção, acesso, auditoria e resposta a incidentes | RH / jurídico / TI |
| `DECISOES.md` | Registro cronológico de decisões, alternativas, justificativa e impacto | Produto |
| `ROADMAP_E_BACKLOG.md` | Épicos, prioridade, dependências, critérios de aceite e status | Produto |
| `PLANO_DE_TESTES.md` | Cenários críticos, dados de teste, permissões, regressão e aceite | Desenvolvimento + usuários-chave |
| `GUIA_OPERACIONAL.md` | Como administradores, RH, gestores e colaboradores usam a plataforma | Produto + RH |

## 4. Regra para decisões e mudanças

Toda mudança relevante deve gerar, no mínimo:

1. **Decisão registrada** em `DECISOES.md`: problema, decisão, motivo, impacto e data.
2. **Atualização da regra funcional** correspondente.
3. **Critérios de aceite testáveis** antes de implementação.
4. **Migration e segurança revisadas** quando envolver banco, RLS, Storage ou dados pessoais.
5. **Atualização de teste/regressão** para proteger o comportamento entregue.

Isso impede que decisões de conversa se percam ou sejam reimplementadas de forma divergente depois.

## 5. Mapa inicial de domínio a validar com a operação

### Pessoas e estrutura
- Empresas, unidades, áreas, centros de custo, operações e equipes.
- Vínculos de trabalho, cargos, contratos, gestores formais e gestores secundários.
- Relações funcionais e carteiras de responsabilidade.

### Rotina operacional
- Tarefas, rotinas recorrentes, processos, checklists, reuniões e ocorrências.
- Situações que devem gerar evidência, aprovação, notificação ou auditoria.

### Jornada e conformidade
- Relógio de ponto, escalas, banco de horas, atrasos, faltas, justificativas e atestados.
- Documentos obrigatórios, validade, assinatura e políticas de retenção.

### Pessoas e desenvolvimento
- Avaliação, metas, feedback, advertência, treinamento, trilhas, recrutamento, admissão e desligamento.

### Integrações
- Ferramenta atual, dono, dados recebidos/enviados, frequência, criticidade, API disponível, arquivo alternativo e restrições.

## 6. Catálogo de integrações e importações

Antes de desenvolver conectores, criar um inventário simples para cada sistema ou arquivo atual:

| Campo | Exemplo |
|---|---|
| Sistema/origem | Relógio de ponto, assinatura digital, planilha de treinamento |
| Dono de negócio | RH, financeiro, logística, SGI |
| Dados envolvidos | Marcações, holerites, certificados |
| Direção | Receber, enviar ou ambos |
| Frequência | Tempo real, diária, mensal, sob demanda |
| Chave de vínculo | Matrícula, CPF protegido, e-mail corporativo, código de veículo |
| Alternativa inicial | Importação CSV/XLSX, upload de documento, cadastro manual |
| Risco e restrição | LGPD, dado médico, financeiro, evidência legal |
| Prioridade | Essencial, importante, futura |

## 7. Conhecimento que deve ser validado em workshops curtos

Os melhores insumos não estarão apenas no código: estão nos responsáveis pela operação. Realizar sessões curtas, por domínio, registrando exemplos reais, exceções e evidências exigidas.

1. **RH e administração:** cadastro, documentos, admissões, desligamentos, férias, ponto e dados sensíveis.
2. **Gestores de unidade:** gestão diária, tarefas, processos, aprovações e comunicação.
3. **Financeiro e caixa:** relações funcionais com unidades, indicadores e limites de atuação.
4. **Operação de motoristas:** logística, manutenção, abastecimento, documentação, SGI e RH.
5. **SGI e treinamento:** evidências, inspeções, requisitos, capacitações e vencimentos.
6. **Tecnologia:** código atual, Supabase, segurança, deploy, integrações e suporte.

Cada workshop deve produzir: fluxo atual, problema, regra, exceção, responsável, documento/evidência e prioridade.

## 8. Governança recomendada

- **Dono de produto:** prioriza valor, valida regras e mantém o backlog.
- **Donos de processo:** validam fluxos de suas áreas e respondem por regras operacionais.
- **RH/jurídico:** aprovam retenção, classificação e acessos a dados sensíveis.
- **Tecnologia:** mantém arquitetura, segurança, migrations, integrações e observabilidade.
- **Usuários-chave:** executam aceite com cenários reais antes de liberar para toda a empresa.

Definir uma revisão quinzenal de produto: decisões tomadas, aprendizados de uso, riscos, integrações e próximos itens prioritários.

## 9. Ordem prática de consolidação

### Etapa A — Inventário do que existe
- Acessar repositório Lovable, projeto Supabase e ambiente publicado.
- Validar migrations aplicadas, tabelas, funções, RLS, buckets, secrets, rotas e pendências técnicas.
- Cruzar o inventário com a especificação funcional já produzida e registrar diferenças.

### Etapa B — Regras organizacionais e acessos
- Mapear empresas, unidades, áreas, equipes e relações funcionais reais.
- Criar a primeira matriz de autonomia por ação e escopo.
- Definir dados sensíveis, aprovações e delegações temporárias.

### Etapa C — Fluxos prioritários
- Escolher de três a cinco fluxos de maior impacto para piloto.
- Registrar cenário normal, exceções, documentos, prazos, notificações e aceite.
- Implementar e testar com usuários-chave antes de escalar.

### Etapa D — Dados e integrações
- Inventariar fontes, arquivos e qualidade de dados.
- Criar modelos de importação e validar um lote controlado.
- Disponibilizar API sandbox e, depois, ativar um conector por vez.

### Etapa E — Operação contínua
- Manter decisões, backlog, testes e guias atualizados a cada entrega.
- Revisar permissões e integrações periodicamente.
- Converter perguntas repetidas em documentação, processo ou treinamento.

## 10. Resultado esperado

Ao concluir a consolidação, a empresa terá uma referência confiável para responder:

- O que a plataforma já faz e o que ainda falta?
- Como cada processo deve funcionar e quem é responsável?
- Quem pode acessar ou aprovar cada tipo de informação?
- De onde vêm os dados e como eles são importados ou integrados?
- Qual mudança foi decidida, por quê e como ela deve ser testada?
- Qual é a próxima entrega mais importante e quais dependências ela possui?
