alter table public.weekend_plans
  add column if not exists is_public boolean not null default false,
  add column if not exists share_slug text unique;

create index if not exists idx_weekend_plans_share_slug on public.weekend_plans(share_slug);
create index if not exists idx_weekend_plans_is_public on public.weekend_plans(is_public);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'weekend_plans' and policyname = 'weekend_plans_select_public'
  ) then
    create policy weekend_plans_select_public
      on public.weekend_plans
      for select
      using (is_public = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plan_items' and policyname = 'plan_items_select_public'
  ) then
    create policy plan_items_select_public
      on public.plan_items
      for select
      using (
        exists (
          select 1 from public.weekend_plans p
          where p.id = plan_items.plan_id and p.is_public = true
        )
      );
  end if;
end
$$;
