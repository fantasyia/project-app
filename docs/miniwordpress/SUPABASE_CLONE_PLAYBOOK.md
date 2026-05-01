# Mini WordPress Supabase Clone Playbook

Status: revisao inicial especializada  
Base: `docs/SUPABASE_CLONE_PLAYBOOK.md` + `scripts/clone-supabase.ts`  
Data: 2026-04-28

## 1. Objetivo

Clonar a estrutura Supabase do Mini WordPress para um novo projeto Supabase, mantendo o Core e permitindo aplicar depois um Brand Adapter.

## 2. Pre-requisitos

- Supabase CLI instalado.
- Supabase CLI autenticado com `supabase login`.
- Node instalado.
- Dependencias instaladas.
- Projeto Supabase destino criado.
- Credenciais do projeto destino:
  - `project-ref`
  - `db password`
  - `anon key`
  - `service role key`

## 3. Comando principal

Em ambiente onde `pnpm` funciona:

```bash
pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

No Windows desta maquina, se `pnpm` nao estiver no PATH, usar:

```powershell
corepack pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

Se o script for chamado via npm:

```powershell
npm.cmd run supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

Observacao: o script atual ainda chama `pnpm` internamente para seed/verify. Em ambientes Windows onde `pnpm` puro nao existe, usar `corepack pnpm` ou ajustar o script antes de usar em massa.

## 4. O que `scripts/clone-supabase.ts` faz

1. Valida argumentos.
2. Confirma que o comando `supabase` existe.
3. Roda `supabase link --project-ref <ref> --yes`.
4. Roda `supabase db push --include-all`.
5. Atualiza `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Roda `pnpm seed`, salvo se `--skip-seed`.
7. Opcionalmente roda `pnpm seed:silo-org` com `--with-silo-org-seed`.
8. Roda `pnpm supabase:verify`, salvo se `--skip-verify`.

## 5. Opcoes suportadas

```txt
--project-ref         Supabase project ref, obrigatorio
--db-password         Senha Postgres remota
--db-url              URL direta Postgres para db push
--supabase-url        Override da URL Supabase
--anon-key            NEXT_PUBLIC_SUPABASE_ANON_KEY
--service-role-key    SUPABASE_SERVICE_ROLE_KEY
--env-file            Arquivo env, padrao .env.local
--skip-link           Nao roda supabase link
--skip-env-update     Nao atualiza env
--skip-seed           Nao roda seed
--with-silo-org-seed  Roda seed:silo-org depois do seed
--skip-verify         Nao roda verify
```

## 6. Fluxo recomendado para projeto novo

1. Criar novo projeto Supabase.
2. Copiar o repositorio/template.
3. Configurar `.env.local` minimo se necessario.
4. Rodar clone com migrations.
5. Rodar verify.
6. Aplicar Brand Adapter.
7. Rodar seed da marca.
8. Abrir `/admin`.

## 7. Fluxo recomendado para projeto existente

1. Fazer backup do projeto destino.
2. Confirmar se banco destino pode receber tabelas do Mini WordPress.
3. Validar nomes de tabelas para evitar conflito.
4. Rodar migrations em ambiente de teste primeiro.
5. Validar `supabase:verify`.
6. Integrar rotas admin no app existente.
7. Integrar frontend template apenas nas rotas autorizadas.

## 8. Verificacao pos-clone

Rodar:

```bash
pnpm supabase:verify
```

Fallback Windows:

```powershell
corepack pnpm supabase:verify
```

ou:

```powershell
npm.cmd run supabase:verify
```

O verify confere:

- Tabelas obrigatorias.
- Colunas obrigatorias.
- Leitura publica anon em `silos`, `posts`, `silo_groups`.

## 9. Cuidados importantes

### Seed atual ainda e CareGlow

O seed atual usa:

- `DEFAULT_AUTHOR = "Equipe CareGlow"`
- `CAREGLOW_EDITORIAL_GROUPS`
- `supabase/seed.json` com conteudo de skincare/CareGlow.

Para um clone neutro, usar `--skip-seed` ate existir seed Core/Brand separado:

```bash
pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>" --skip-seed
```

### Migrations contem Brand

Algumas migrations atuais tem CareGlow no nome/conteudo:

- `20260226_01_seed_careglow_silos_and_groups.sql`
- `20260312_01_rename_careglow_silos.sql`
- `20260313_01_restore_careglow_silo_slugs.sql`

Antes do ZIP neutro, separar migrations de seed/brand das migrations Core.

### `supabase/schema.sql` pode estar incompleto

Nao usar `schema.sql` como unica fonte para clone. Usar migrations.

## 10. Troubleshooting

### `pnpm` nao reconhecido

Usar:

```powershell
corepack pnpm <comando>
```

ou:

```powershell
npm.cmd run <script>
```

### `npm.ps1` bloqueado

Usar `npm.cmd`.

### Supabase CLI nao encontrado

Instalar Supabase CLI e autenticar com:

```bash
supabase login
```

### Bucket de media ausente

O endpoint de media tenta criar bucket `media` automaticamente se receber erro `Bucket not found`, mas o service role precisa permissao.

## 11. Pendencias para estabilizar

- [ ] Ajustar `scripts/clone-supabase.ts` para escolher package runner (`pnpm`, `corepack pnpm`, `npm.cmd`) conforme ambiente.
- [ ] Criar seed Core separado.
- [ ] Criar seed Brand separado.
- [ ] Remover migrations CareGlow do pacote neutro.
- [ ] Rodar clone real em projeto Supabase limpo e registrar resultado.
