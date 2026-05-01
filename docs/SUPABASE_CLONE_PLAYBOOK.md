# Supabase Clone Playbook (multi-nicho)

Objetivo: clonar este projeto para um novo dominio/nicho, recriando o banco com a mesma estrutura (tabelas, campos e estado UNRESTRICTED nas tabelas publicas usadas pelo app), mudando apenas as chaves do novo Supabase.

## 1) Pre-requisitos

- `supabase` CLI instalado e autenticado (`supabase login`)
- `pnpm` instalado
- Credenciais do novo projeto:
  - `project-ref`
  - senha do banco remoto (`db password`)
  - `anon key`
  - `service role key`

## 2) Comando unico (recomendado)

No root do projeto:

```bash
pnpm supabase:clone -- \
  --project-ref SEU_PROJECT_REF \
  --db-password "SENHA_DB_REMOTA" \
  --anon-key "NOVA_ANON_KEY" \
  --service-role-key "NOVA_SERVICE_ROLE_KEY"
```

Esse comando faz:

1. `supabase link` no novo projeto.
2. `supabase db push --include-all` (aplica todas as migrations versionadas).
3. Atualiza `.env.local` com novas chaves Supabase.
4. Roda `pnpm seed`.
5. Roda `pnpm supabase:verify` para validar schema/colunas/leituras publicas minimas.

## 3) Comandos manuais (fallback)

Se quiser rodar em etapas:

```bash
supabase link --project-ref SEU_PROJECT_REF --password "SENHA_DB_REMOTA"
supabase db push --linked --include-all --password "SENHA_DB_REMOTA"
pnpm seed
pnpm supabase:verify
```

Depois ajuste no `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Tabelas esperadas no clone

No `schema public`, o app espera (entre outras) as tabelas:

- `google_cse_settings`
- `link_audits`
- `post_link_occurrences`
- `post_links`
- `posts`
- `silo_audits`
- `silo_groups`
- `silo_posts`
- `silos`
- `wp_app_passwords`
- `wp_id_map`
- `wp_media`

## 5) Replicar para muitos nichos (fluxo padrao)

1. Copie o projeto/template.
2. Ajuste branding, dominio e conteudo seed (`supabase/seed.json`).
3. Rode `pnpm supabase:clone -- ...` apontando para o novo Supabase.
4. Valide no painel `/admin` e rotas publicas.

## 6) Boas praticas para nao quebrar clones futuros

- Toda mudanca de banco deve virar migration em `supabase/migrations`.
- Nao deixar SQL estrutural novo apenas em `migrations/` solta.
- Antes de publicar template novo, rode `pnpm supabase:verify`.
