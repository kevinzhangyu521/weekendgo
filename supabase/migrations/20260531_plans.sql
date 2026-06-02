create table if not exists public.weekend_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Weekend Plan',
  plan_date date not null,
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekend_plans(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  sort_order integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (plan_id, destination_id)
);

create index if not exists idx_weekend_plans_user_date on public.weekend_plans(user_id, plan_date desc);
create index if not exists idx_plan_items_plan on public.plan_items(plan_id, sort_order asc);

alter table public.weekend_plans enable row level security;
alter table public.plan_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weekend_plans' and policyname = 'weekend_plans_select_own'
  ) then
    create policy weekend_plans_select_own
      on public.weekend_plans
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weekend_plans' and policyname = 'weekend_plans_insert_own'
  ) then
    create policy weekend_plans_insert_own
      on public.weekend_plans
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weekend_plans' and policyname = 'weekend_plans_update_own'
  ) then
    create policy weekend_plans_update_own
      on public.weekend_plans
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weekend_plans' and policyname = 'weekend_plans_delete_own'
  ) then
    create policy weekend_plans_delete_own
      on public.weekend_plans
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plan_items' and policyname = 'plan_items_select_own'
  ) then
    create policy plan_items_select_own
      on public.plan_items
      for select
      using (
        exists (
          select 1 from public.weekend_plans p
          where p.id = plan_items.plan_id and p.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plan_items' and policyname = 'plan_items_insert_own'
  ) then
    create policy plan_items_insert_own
      on public.plan_items
      for insert
      with check (
        exists (
          select 1 from public.weekend_plans p
          where p.id = plan_items.plan_id and p.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plan_items' and policyname = 'plan_items_delete_own'
  ) then
    create policy plan_items_delete_own
      on public.plan_items
      for delete
      using (
        exists (
          select 1 from public.weekend_plans p
          where p.id = plan_items.plan_id and p.user_id = auth.uid()
        )
      );
  end if;
end
$$;
