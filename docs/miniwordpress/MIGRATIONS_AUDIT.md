# Migrations Audit

Este documento registra o estado das migrations do Mini WordPress e como organiza-las antes de exportar o sistema.

## Estado atual

Existem duas areas de SQL:

- `supabase/migrations/`: migrations versionadas principais.
- `migrations/`: scripts SQL soltos/legados.

Para produto reutilizavel, `supabase/migrations/` deve ser a fonte canonica. A pasta raiz `migrations/` deve ser auditada, migrada ou arquivada.

## Migrations canonicas atuais

Em `supabase/migrations/`:

- `20260121_00_bootstrap_core_tables.sql`
- `20260122_01_add_post_editor_fields.sql`
- `20260123_01_sync_posts_schema.sql`
- `20260124_01_guardian_silo.sql`
- `20260125_01_pillar_silos.sql`
- `20260130_01_wp_adapter.sql`
- `20260202_01_serp_cache_google_settings.sql`
- `20260203_01_focus_keyword.sql`
- `20260219_01_silo_menu_groups.sql`
- `20260220_01_silo_role_order.sql`
- `20260221_01_unique_pillar_per_silo.sql`
- `20260222_01_silo_groups_config.sql`
- `20260223_01_seed_core_public_silos.sql`
- `20260225_01_canonical_silo_map_audits.sql`
- `20260226_01_seed_careglow_silos_and_groups.sql`
- `20260312_01_rename_careglow_silos.sql`
- `20260313_01_restore_careglow_silo_slugs.sql`

## Scripts soltos/legados

Em `migrations/`:

- `00_complete_silo_map_setup.sql`
- `02_silo_v2_setup.sql`
- `03_silo_v2_link_details.sql`
- `04_silo_v2_link_positions.sql`
- `05_link_audits_repair_fields.sql`
- `create_post_link_occurrences.sql`
- `create_silo_audit_tables.sql`
- `create_silo_posts.sql`

Esses arquivos podem conter historico util, mas nao devem ser executados automaticamente em projeto novo sem auditoria.

## Tabelas esperadas

Ver tambem `DATABASE_SCHEMA.md`.

Tabelas Core:

- `posts`
- `silos`
- `silo_posts`
- `silo_groups`
- `post_links`
- `post_link_occurrences`
- `link_audits`
- `silo_audits`
- `google_cse_settings`
- `wp_app_passwords`
- `wp_id_map`
- `wp_media`

## Problemas atuais

### Seeds CareGlow dentro de migrations canonicas

Arquivos como:

- `20260226_01_seed_careglow_silos_and_groups.sql`
- `20260312_01_rename_careglow_silos.sql`
- `20260313_01_restore_careglow_silo_slugs.sql`

pertencem ao Brand Adapter CareGlow, nao ao Core.

Para pacote neutro:

- mover para `seed/brands/careglow` ou migration opcional de exemplo;
- manter apenas estrutura Core em migrations obrigatorias.

### SQL legado duplicado

Arquivos em `migrations/` podem duplicar ou reparar coisas ja migradas em `supabase/migrations/`.

Antes de exportar:

- comparar tabelas e colunas;
- marcar cada arquivo como `merged`, `obsolete`, `manual repair` ou `brand seed`;
- remover execucao automatica.

### Schema snapshot incompleto

`supabase/schema.sql` precisa ser comparado com `scripts/verify-supabase.ts`.

O verificador deve ser a referencia operacional ate o schema snapshot ser atualizado.

## Plano de consolidacao

1. Rodar `npm run supabase:verify` no banco atual.
2. Gerar snapshot real do schema.
3. Comparar snapshot com `supabase/migrations`.
4. Comparar scripts soltos da pasta `migrations/`.
5. Criar nova sequencia canonica para pacote neutro.
6. Mover seeds CareGlow para Brand Adapter.
7. Atualizar `SUPABASE_CLONE_PLAYBOOK.md`.
8. Testar em Supabase limpo.

## Estrutura futura

```text
supabase/
  migrations/
    0001_core_tables.sql
    0002_editor_fields.sql
    0003_silos.sql
    0004_links_and_audits.sql
    0005_wp_adapter.sql
    0006_serp_google.sql
  seeds/
    example_brand.sql
    careglow.sql
migrations-legacy/
  README.md
```

## Regras

- Migration Core nao pode depender de CareGlow.
- Seed de marca nao pode ser obrigatorio para subir o sistema.
- Repair SQL deve ser documentado e nao misturado com bootstrap.
- Toda tabela nova deve entrar em `DATABASE_SCHEMA.md`.
- Todo clone deve terminar com verificador verde.

## Checklist antes de aplicar em outra marca

- Banco limpo recebe todas as migrations Core.
- CareGlow nao aparece nas migrations obrigatorias.
- Seeds da nova marca sao separadas.
- RLS foi revisada.
- Storage buckets foram criados ou documentados.
- Verificador passa.
