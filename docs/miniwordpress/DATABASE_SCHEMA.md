# Mini WordPress Database Schema

Status: draft tecnico inicial  
Fonte atual: `supabase/migrations`, `supabase/schema.sql`, `scripts/verify-supabase.ts`  
Data: 2026-04-28

## 1. Fonte de verdade

A fonte pretendida de verdade para o banco e:

```txt
supabase/migrations/
```

`supabase/schema.sql` existe como snapshot, mas esta incompleto em relacao ao app atual e ao script `scripts/verify-supabase.ts`.

`migrations/` na raiz existe como SQL solto/legado e precisa auditoria arquivo por arquivo antes de qualquer remocao ou merge.

## 2. Tabelas obrigatorias

O script `scripts/verify-supabase.ts` considera obrigatorias estas tabelas:

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

Leitura publica esperada com anon key:

- `silos`
- `posts`
- `silo_groups`

## 3. Tabela `silos`

Funcao: cadastro dos hubs/silos editoriais.

Colunas obrigatorias conforme verifier:

- `id`
- `name`
- `slug`
- `description`
- `meta_title`
- `meta_description`
- `hero_image_url`
- `hero_image_alt`
- `pillar_content_json`
- `pillar_content_html`
- `menu_order`
- `is_active`
- `show_in_navigation`
- `created_at`

Uso no sistema:

- Listagem publica de silos.
- Menu publico de silos.
- Admin `/admin/silos`.
- Painel de silo `/admin/silos/[slug]`.
- Associacao com posts.

Brand/Core:

- Estrutura da tabela e Core.
- Dados/seeds de silos sao Brand Adapter.

## 4. Tabela `posts`

Funcao: artigos, paginas editoriais e posts importados do Contentor.

Colunas obrigatorias conforme verifier:

- `id`
- `silo_id`
- `title`
- `slug`
- `target_keyword`
- `focus_keyword`
- `meta_title`
- `meta_description`
- `seo_title`
- `canonical_path`
- `schema_type`
- `supporting_keywords`
- `entities`
- `hero_image_url`
- `hero_image_alt`
- `og_image_url`
- `images`
- `cover_image`
- `author_name`
- `expert_name`
- `expert_role`
- `expert_bio`
- `expert_credentials`
- `reviewed_by`
- `reviewed_at`
- `sources`
- `disclaimer`
- `faq_json`
- `howto_json`
- `content_json`
- `content_html`
- `status`
- `published`
- `published_at`
- `scheduled_at`
- `amazon_products`
- `silo_role`
- `silo_group`
- `silo_order`
- `silo_group_order`
- `show_in_silo_menu`
- `excerpt`
- `imported_source`
- `imported_at`
- `raw_payload`
- `updated_at`

Status esperados:

- `draft`
- `review`
- `scheduled`
- `published`

Schema type esperados:

- `article`
- `review`
- `faq`
- `howto`

Brand/Core:

- Estrutura da tabela e Core.
- Conteudo dos posts e Brand.
- Regras de SEO/silos aplicadas ao post sao Core.

## 5. Linkagem interna

### `post_links`

Funcao: indice de links encontrados/criados em posts.

Colunas:

- `id`
- `source_post_id`
- `target_post_id`
- `target_url`
- `anchor_text`
- `link_type`
- `rel_flags`
- `is_blank`
- `created_at`

### `post_link_occurrences`

Funcao: ocorrencias detalhadas de links no conteudo.

Colunas:

- `id`
- `silo_id`
- `source_post_id`
- `target_post_id`
- `anchor_text`
- `context_snippet`
- `position_bucket`
- `href_normalized`
- `link_type`
- `is_nofollow`
- `is_sponsored`
- `is_ugc`
- `is_blank`
- `start_index`
- `end_index`
- `occurrence_key`
- `created_at`
- `updated_at`

### `link_audits`

Funcao: recomendacoes e auditoria de links.

Colunas:

- `id`
- `silo_id`
- `occurrence_id`
- `score`
- `label`
- `reasons`
- `suggested_anchor`
- `note`
- `action`
- `recommendation`
- `spam_risk`
- `intent_match`
- `created_at`

## 6. Silos e organizacao

### `silo_posts`

Funcao: hierarquia editorial entre posts e silos.

Colunas:

- `silo_id`
- `post_id`
- `role`
- `position`
- `level`
- `parent_post_id`
- `created_at`
- `updated_at`

### `silo_groups`

Funcao: grupos editoriais dentro do silo, usados para menu/organizacao.

Colunas:

- `id`
- `silo_id`
- `key`
- `label`
- `menu_order`
- `keywords`
- `created_at`
- `updated_at`

### `silo_audits`

Funcao: snapshots de saude do silo.

Colunas:

- `id`
- `silo_id`
- `fingerprint`
- `health_score`
- `status`
- `summary`
- `issues`
- `created_at`
- `updated_at`

## 7. Google / SERP

### `google_cse_settings`

Funcao: armazenar configuracao Google Custom Search.

Colunas:

- `id`
- `api_key`
- `cx`
- `created_at`
- `updated_at`

## 8. Contentor / WordPress adapter

### `wp_app_passwords`

Funcao: credenciais estilo WordPress Application Password.

Colunas:

- `id`
- `username`
- `display_name`
- `password_hash`
- `is_active`
- `created_at`

### `wp_id_map`

Funcao: mapear UUIDs internos para IDs numericos estilo WordPress.

Colunas:

- `id`
- `entity_type`
- `entity_uuid`
- `entity_key`
- `created_at`

### `wp_media`

Funcao: registrar midias importadas via adapter.

Colunas:

- `id`
- `url`
- `alt_text`
- `title`
- `created_at`

## 9. Migrations atuais

Fonte principal:

```txt
supabase/migrations/
```

Arquivos atuais:

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

Observacao:

- Migrations `seed_careglow`, `rename_careglow` e `restore_careglow` sao Brand/Legacy dentro da pasta principal.
- Antes de exportar pacote neutro, separar migrations Core de migrations Brand.

## 10. SQL solto em `migrations/`

Arquivos atuais:

- `00_complete_silo_map_setup.sql`
- `02_silo_v2_setup.sql`
- `03_silo_v2_link_details.sql`
- `04_silo_v2_link_positions.sql`
- `05_link_audits_repair_fields.sql`
- `create_post_link_occurrences.sql`
- `create_silo_audit_tables.sql`
- `create_silo_posts.sql`

Status:

- Pending audit.
- Nao mover/remover sem comparar contra `supabase/migrations`.
- Possivelmente contem origem de recursos depois consolidados.

## 11. Seeds

Arquivo atual:

```txt
supabase/seed.json
```

Script atual:

```txt
scripts/seed.ts
```

Problema:

- `scripts/seed.ts` tem `DEFAULT_AUTHOR = "Equipe CareGlow"`.
- Grupos editoriais sao `CAREGLOW_EDITORIAL_GROUPS`.
- Importa `AMAZON_AFFILIATE_DISCLOSURE` de `lib/site`, hoje CareGlow.

Decisao:

- Seed estrutural deve virar Core.
- Seed de silos/posts/grupos deve virar Brand Adapter.

## 12. Verificacao

Comando atual:

```bash
pnpm supabase:verify
```

Windows fallback:

```powershell
corepack pnpm supabase:verify
```

ou:

```powershell
npm.cmd run supabase:verify
```

O verifier usa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 13. Pendencias antes do pacote neutro

- [ ] Reconciliar `supabase/schema.sql` com `scripts/verify-supabase.ts`.
- [ ] Classificar cada migration como Core ou Brand.
- [ ] Separar seed Core e Brand.
- [ ] Remover CareGlow do script seed principal.
- [ ] Decidir destino de `migrations/` solta.
- [ ] Documentar politicas/RLS se forem adicionadas.
