# Prévia de Importação — Empregados Ativos

**Fonte:** `Empregados Ativos.pdf` — relatório ERP emitido em 5 de agosto de 2026.  
**Objetivo:** preparar a primeira carga de pessoas e vínculos organizacionais para o ambiente de desenvolvimento RHTrevo.

## Resultado da extração

- **282 empregados ativos** no total dos 36 agrupamentos do relatório.
- **282 registros estruturados**, conferindo integralmente com o total declarado na fonte.
- **30 agrupamentos de empresa/local** identificados para criação ou associação.
- **13 nomes empresariais** identificados, distribuídos em múltiplos códigos de empresa do ERP.
- **1 função precisa de revisão manual** antes da carga: `OFFICE GIRL` não foi mapeada automaticamente pelo classificador de funções.

## Campos preparados para importação

- código da empresa no ERP;
- nome da empresa;
- local do ERP;
- matrícula do empregado no ERP;
- nome completo;
- função/cargo informado;
- data de admissão;
- indicador de confiança da leitura.

## Campos deliberadamente excluídos

CPF, PIS e RG estão presentes no PDF de origem, mas foram **deliberadamente excluídos** da prévia de importação e não serão gravados na plataforma nesta fase. Eles exigem política documental, classificação e permissão específica antes de qualquer uso.

## Ajuste de modelo necessário antes da carga

O ERP reutiliza a matrícula em empresas diferentes. Por isso, a matrícula não pode ser única globalmente em `employees`; ela será identificada por **empresa + matrícula** no vínculo (`employee_assignments`).

Foi criada a migration local `20260805185000_add_erp_import_identifiers.sql`, ainda pendente de aplicação, para:

1. guardar o código externo da empresa;
2. permitir nomes empresariais repetidos quando os códigos ERP forem distintos;
3. identificar a matrícula da origem no vínculo de empresa;
4. garantir unicidade somente por empresa e matrícula ativa.

## Próxima sequência segura

1. Aplicar a migration de identificadores no Supabase de desenvolvimento.
2. Criar/importar empresas e unidades a partir dos códigos e locais do ERP.
3. Criar o catálogo de cargos a partir das funções identificadas.
4. Importar os 282 registros como pessoas e vínculos, sem criar contas de acesso.
5. Revisar a única função não mapeada e eventuais divergências de empresa/unidade.
6. Apenas depois configurar relações, responsabilidades, permissões e logins individuais.
