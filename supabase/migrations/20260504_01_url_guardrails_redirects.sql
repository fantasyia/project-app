-- Mini WordPress 3.0 URL guardrails for FantasyIA.
-- Scope: blog/editorial only. This migration intentionally does not touch
-- the private app social `posts` table.

alter table public.blog_articles
  add column if not exists url_locked_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_redirect_path text,
  add column if not exists deletion_reason text;

alter table public.silos
  add column if not exists url_locked_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_redirect_path text,
  add column if not exists deletion_reason text;

create table if not exists public.url_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  target_path text not null default '/dashboard/blog/pagina-nao-encontrada',
  entity_type text not null check (entity_type in ('post', 'silo')),
  entity_id uuid,
  status_code integer not null default 308 check (status_code in (301, 302, 307, 308)),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.url_redirects enable row level security;

drop policy if exists "url_redirects public read" on public.url_redirects;
create policy "url_redirects public read"
  on public.url_redirects
  for select
  using (true);

update public.blog_articles
set url_locked_at = coalesce(published_at, updated_at, now())
where url_locked_at is null
  and (published is true or status = 'published' or published_at is not null);

update public.silos s
set url_locked_at = coalesce(s.updated_at, now())
where s.url_locked_at is null
  and exists (
    select 1
    from public.blog_articles a
    where a.silo_id = s.id
      and (a.published is true or a.status = 'published' or a.published_at is not null)
  );

create or replace function public.mw3_prevent_locked_blog_url_change()
returns trigger
language plpgsql
as $$
begin
  if old.deleted_at is not null then
    if new.slug is distinct from old.slug or new.canonical_path is distinct from old.canonical_path then
      raise exception 'BLOG_URL_LOCKED';
    end if;
  end if;

  if (
    old.url_locked_at is not null
    or old.published is true
    or old.status = 'published'
    or old.published_at is not null
  ) then
    if new.slug is distinct from old.slug or new.canonical_path is distinct from old.canonical_path then
      raise exception 'BLOG_URL_LOCKED';
    end if;
  end if;

  if (new.published is true or new.status = 'published' or new.published_at is not null) and new.url_locked_at is null then
    new.url_locked_at := coalesce(new.published_at, now());
  end if;

  if (new.published is true or new.status = 'published' or new.published_at is not null) and new.silo_id is not null then
    update public.silos
    set url_locked_at = coalesce(url_locked_at, now())
    where id = new.silo_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_mw3_prevent_locked_blog_url_change on public.blog_articles;
create trigger trg_mw3_prevent_locked_blog_url_change
before update on public.blog_articles
for each row
execute function public.mw3_prevent_locked_blog_url_change();

create or replace function public.mw3_prevent_locked_silo_url_change()
returns trigger
language plpgsql
as $$
begin
  if old.deleted_at is not null and new.slug is distinct from old.slug then
    raise exception 'SILO_URL_LOCKED';
  end if;

  if old.url_locked_at is not null and new.slug is distinct from old.slug then
    raise exception 'SILO_URL_LOCKED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_mw3_prevent_locked_silo_url_change on public.silos;
create trigger trg_mw3_prevent_locked_silo_url_change
before update on public.silos
for each row
execute function public.mw3_prevent_locked_silo_url_change();

create index if not exists blog_articles_public_not_deleted_idx
  on public.blog_articles (published, deleted_at, silo_id, slug);

create index if not exists silos_public_not_deleted_idx
  on public.silos (deleted_at, slug);

notify pgrst, 'reload schema';
