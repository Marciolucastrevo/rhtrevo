# Supabase — RHTrevo

## Estado atual

A migration inicial está versionada, mas **não foi aplicada** ao projeto Supabase. Ela cria a fundação de empresas, unidades, áreas, equipes, pessoas, vínculos, relações, permissões individuais, classificação sensível e auditoria.

## Ordem segura de aplicação

1. Revisar a migration `migrations/20260805182000_foundation_organization_access.sql`.
2. Vincular a CLI ao projeto de desenvolvimento `Rhtrevo` com autenticação local — nunca com uma chave no repositório.
3. Aplicar a migration somente no ambiente de desenvolvimento.
4. Criar o primeiro usuário de autenticação para Lucas.
5. Atribuir o papel `root_admin` por operação administrativa controlada.
6. Validar que um usuário sem esse papel não enxerga registros.
7. Só então habilitar as telas de configuração organizacional.

## Bootstrap do administrador raiz

O bootstrap precisa ocorrer **depois** que o usuário de autenticação for criado, utilizando o UUID desse usuário. A inserção deve ser executada por um operador autorizado no SQL Editor ou por uma função administrativa de backend, nunca no navegador:

```sql
insert into public.user_roles (user_id, role, reason)
values ('<UUID_DO_USUARIO_DE_LUCAS>', 'root_admin', 'Bootstrap inicial controlado');
```

Não salve esse UUID, senha, service role ou credenciais de banco em arquivos versionados.

## Variáveis locais

O aplicativo web usa somente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

A chave `SUPABASE_SERVICE_ROLE_KEY` é reservada a handlers de servidor e não pode ser importada pela aplicação do navegador.
