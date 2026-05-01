# Supabase DB Setup

Este projeto usa `supabase/migrations` como fonte de verdade do schema.

## Setup rapido (recomendado)

```bash
pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

Esse comando:

1. Linka o projeto Supabase alvo.
2. Aplica todas as migrations (`supabase db push --include-all`).
3. Atualiza `.env.local` com novas chaves.
4. Roda `pnpm seed`.
5. Roda `pnpm supabase:verify`.

## Setup manual

```bash
supabase link --project-ref <PROJECT_REF> --password "<DB_PASSWORD>"
supabase db push --linked --include-all --password "<DB_PASSWORD>"
pnpm seed
pnpm supabase:verify
```

Depois ajuste em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Quando usar `schema.sql`

`supabase/schema.sql` existe como referencia historica.  
Para replicacao confiavel entre nichos, use sempre `supabase/migrations` + `pnpm supabase:clone`.
