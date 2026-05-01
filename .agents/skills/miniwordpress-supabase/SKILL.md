---
name: miniwordpress-supabase
description: Supabase setup, clone, schema verification, and database adaptation skill for Mini WordPress. Use when Codex works on Supabase tables, clone scripts, RLS, seeds, storage buckets, or brand database bootstrap.
---

# Mini WordPress Supabase

## Read first

- `docs/miniwordpress/DATABASE_SCHEMA.md`
- `docs/miniwordpress/SUPABASE_CLONE_PLAYBOOK.md`
- `docs/miniwordpress/MIGRATIONS_AUDIT.md`

## Workflow

1. Inspect `package.json` scripts.
2. Inspect `scripts/verify-supabase.ts` before trusting schema snapshots.
3. Treat `supabase/migrations/` as canonical and root `migrations/` as legacy until audited.
4. Separate Core schema from brand seeds.
5. Use `npm.cmd run supabase:verify` when verification is requested or after schema work.

## Core tables

Expected Core includes:

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

## Guardrails

- Do not bake CareGlow seeds into Core migrations.
- Do not expose private admin data through public RLS.
- Do not assume `supabase/schema.sql` is complete if verifier says otherwise.
- Keep brand seeds optional.
