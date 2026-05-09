-- FantasyIA social comments and edit-before-view support.
-- Scope: private app feed comments and canonical chat_messages only.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type public.moderation_status as enum ('visible', 'removed');
  end if;
end $$;

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade,
  add column if not exists moderation_status public.moderation_status not null default 'visible',
  add column if not exists edited_at timestamp,
  add column if not exists deleted_at timestamp,
  add column if not exists deleted_by uuid references public.users(id) on delete set null;

create index if not exists idx_comments_parent_id on public.comments using btree (parent_id);
create index if not exists idx_comments_post_parent_created on public.comments using btree (post_id, parent_id, created_at);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_comment_likes_user_id on public.comment_likes using btree (user_id);

create table if not exists public.comment_views (
  comment_id uuid not null references public.comments(id) on delete cascade,
  viewer_id uuid not null references public.users(id) on delete cascade,
  viewed_at timestamp not null default now(),
  primary key (comment_id, viewer_id)
);

create index if not exists idx_comment_views_viewer_id on public.comment_views using btree (viewer_id);

alter table public.chat_messages
  add column if not exists edited_at timestamp;
