-- Creator-scoped comment bans.
-- Blocks a user from commenting on a creator's posts without changing content access.

create table if not exists public.creator_comment_bans (
  creator_id uuid not null references public.users(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  banned_by uuid references public.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  primary key (creator_id, user_id)
);

create index if not exists idx_creator_comment_bans_user
  on public.creator_comment_bans(user_id);
