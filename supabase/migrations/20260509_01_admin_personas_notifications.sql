-- Admin role personas, notification preferences and moderation action audit.

do $$
begin
  create type notification_channel as enum ('in_app', 'email');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type notification_type as enum ('messages', 'likes', 'comments', 'moderation', 'financial', 'system');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type moderation_action_type as enum ('warning', 'recommendation', 'block');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_role_personas (
  admin_user_id uuid not null references public.users(id) on delete cascade,
  role user_role not null,
  persona_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (admin_user_id, role),
  constraint admin_role_personas_persona_unique unique (persona_user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(80) not null,
  title varchar(180) not null,
  body text,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_read
  on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  channel notification_channel not null,
  type notification_type not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel, type)
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  action_type moderation_action_type not null,
  creator_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  admin_user_id uuid references public.users(id) on delete set null,
  persona_user_id uuid references public.users(id) on delete set null,
  reason text not null,
  recommendation text,
  email_status varchar(40) not null default 'not_sent',
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_actions_creator
  on public.moderation_actions(creator_id, created_at desc);

create index if not exists idx_moderation_actions_post
  on public.moderation_actions(post_id);
