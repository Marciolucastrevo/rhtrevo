# Mapeamento de Empresas do ERP para RHTrevo

**Fonte:** códigos empresariais informados pelo administrador e relatório `Empregados Ativos.pdf`.

## Mapeamentos diretos informados

| Código ERP | Nome operacional no RHTrevo | Registros no relatório |
|---:|---|---:|
| 1000 | Posto Trevo Vilhena | 60 |
| 1001 | Posto Cidade | 20 |
| 2000 | TRR Comodoro | 12 |
| 3000 | Trevo Transportes | 79 |
| 9000 | ALM Investimentos | 2 |
| 10000 | Chácara | 1 |
| 11000 | M. Ramalho | 27 |
| 12000 | GB Transportes | 1 |
| 14000 | AGM Transportes | 1 |
| 15000 | LBJ Tecnologia e Serviços | 2 |
| 17000 | REEN Empreendimentos | 1 |
| 19000 | Viva Ambiental | 20 |
| 20000 | Vavie (Posto Trevo III PVH) | 9 |

## Mapeamentos provisórios a confirmar

Estes códigos aparecem no relatório, mas não foram listados diretamente no mapa operacional. A proposta abaixo agrupa-os pela razão social do ERP; nenhuma carga será executada usando essas associações sem confirmação.

| Código ERP | Razão social no relatório | Proposta operacional | Registros |
|---:|---|---|---:|
| 2001 | TRR Comodoro Diesel LTDA | TRR Comodoro | 9 |
| 3001 | Trevo Transportes e Logística LTDA | Trevo Transportes | 7 |
| 3002 | Trevo Transportes e Logística LTDA | Trevo Transportes | 15 |
| 4001 | Trevo Peças e Serviços para Automóveis LTDA | Trevo Peças | 16 |

## Códigos informados sem empregados ativos neste relatório

5000 Trevo Participações; 6000 Trevo Locadora; 7000 Trevo Informática; 8000 Marcio Ramalho (despesas particulares); 13000 inexistente; 16000 MGL Participações; 18000 GB Participações.

## Regras para a importação

- Cada código ERP será registrado como `external_code` da empresa no RHTrevo.
- Códigos distintos podem apontar para uma mesma empresa operacional somente após confirmação explícita.
- Os locais do relatório serão criados como unidades vinculadas à empresa/código correspondente.
- A matrícula será vinculada por `empresa + matrícula` e não ficará única globalmente.
