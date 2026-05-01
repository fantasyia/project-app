---
name: miniwordpress-migrations
description: Migration audit and consolidation skill for Mini WordPress. Use when Codex needs to review, reorder, consolidate, split, or document Supabase SQL migrations and distinguish canonical Core migrations from legacy repair scripts or brand seeds.
---

# Mini WordPress Migrations

## Read first

- `docs/miniwordpress/MIGRATIONS_AUDIT.md`
- `docs/miniwordpress/DATABASE_SCHEMA.md`
- `docs/miniwordpress/SUPABASE_CLONE_PLAYBOOK.md`

## Workflow

1. List `supabase/migrations/`.
2. List root `migrations/`.
3. Mark each SQL file as:
   - Core schema
   - Core feature extension
   - Brand seed
   - Manual repair
   - Obsolete/legacy
4. Check whether CareGlow-specific migrations can be moved to brand seeds.
5. Update docs before changing execution order.

## Rules

- Core migrations must not require CareGlow.
- Brand seeds must not be mandatory for system bootstrap.
- Repair SQL must not be hidden in bootstrap migrations.
- Any new table or column must be reflected in `DATABASE_SCHEMA.md`.
- Verify with `npm.cmd run supabase:verify` when possible.
