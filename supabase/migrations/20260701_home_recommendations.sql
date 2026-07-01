create table if not exists public.home_recommendations (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  section_type text not null check (section_type in ('today_pick', 'more_explore')),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  start_at timestamptz null,
  end_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_recommendations_section_idx
  on public.home_recommendations(section_type, is_active, sort_order);

create unique index if not exists home_recommendations_unique_position
  on public.home_recommendations(destination_id, section_type);

alter table public.home_recommendations enable row level security;

drop policy if exists "Public can read active home recommendations" on public.home_recommendations;
create policy "Public can read active home recommendations"
  on public.home_recommendations
  for select
  using (
    is_active = true
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now())
  );

drop policy if exists "Admins can manage home recommendations" on public.home_recommendations;
create policy "Admins can manage home recommendations"
  on public.home_recommendations
  for all
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );
