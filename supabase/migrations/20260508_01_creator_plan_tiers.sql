-- Creator-owned plan tiers, Basic naming, promotions and media moderation.

do $$
begin
  create type subscription_plan_key as enum ('premium', 'emerald');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type post_content_tier as enum ('basic', 'premium', 'emerald', 'ppv');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type creator_promotion_type as enum ('basic_ppv', 'basic_chat');
exception
  when duplicate_object then null;
end $$;

alter table public.creator_profiles
  add column if not exists default_ppv_price text,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_by uuid references public.users(id) on delete set null;

alter table public.subscription_plans
  add column if not exists plan_key subscription_plan_key not null default 'premium';

create index if not exists idx_subscription_plans_key
  on public.subscription_plans(creator_id, plan_key);

alter table public.posts
  add column if not exists content_tier post_content_tier not null default 'basic';

update public.posts
set content_tier = case
  when case
    when coalesce(price, '') ~ '^[0-9]+(\.[0-9]+)?$' then price::numeric
    else 0
  end > 0 then 'ppv'::post_content_tier
  when access_tier = 'premium' then 'premium'::post_content_tier
  else 'basic'::post_content_tier
end
where content_tier = 'basic';

create index if not exists idx_posts_content_tier
  on public.posts(content_tier, created_at desc);

create table if not exists public.creator_promotions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  promotion_type creator_promotion_type not null,
  title varchar(150) not null,
  discount_percent integer not null default 5 check (discount_percent between 5 and 50),
  user_limit integer not null default 10 check (user_limit > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_creator_promotions_lookup
  on public.creator_promotions(creator_id, promotion_type, is_active);

create table if not exists public.creator_warnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  admin_id uuid references public.users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_creator_warnings_creator
  on public.creator_warnings(creator_id);

create index if not exists idx_creator_warnings_post
  on public.creator_warnings(post_id);
