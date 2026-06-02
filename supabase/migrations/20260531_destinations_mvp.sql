create extension if not exists "pgcrypto";

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'Shanghai',
  latitude double precision not null,
  longitude double precision not null,
  scenario text not null check (scenario in ('camping', 'creek', 'hiking', 'picnic')),
  distance_km double precision not null default 0,
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  safety text not null check (safety in ('low_risk', 'medium_risk', 'high_risk')),
  rating double precision not null default 0,
  has_parking boolean not null default false,
  has_toilet boolean not null default false,
  min_kid_age integer not null default 0,
  image text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_destinations_scenario on public.destinations(scenario);
create index if not exists idx_destinations_distance on public.destinations(distance_km);
create index if not exists idx_destinations_rating on public.destinations(rating desc);

alter table public.destinations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'destinations'
      and policyname = 'destinations_public_read'
  ) then
    create policy destinations_public_read
      on public.destinations
      for select
      using (true);
  end if;
end
$$;
