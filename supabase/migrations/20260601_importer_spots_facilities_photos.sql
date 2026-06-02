create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  name_zh text,
  city text not null,
  city_zh text,
  lat double precision not null,
  lng double precision not null,
  scenario text not null check (scenario in ('camping', 'creek', 'hiking', 'picnic')),
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  safety text not null check (safety in ('low_risk', 'medium_risk', 'high_risk')),
  distance_km integer default 0,
  description text default '',
  description_zh text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_zh text,
  created_at timestamptz not null default now()
);

create table if not exists public.spot_facilities (
  spot_id uuid not null references public.spots(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, facility_id)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  url text not null,
  caption text,
  caption_zh text,
  sort_order integer default 0,
  is_cover boolean default false,
  created_at timestamptz not null default now(),
  unique (spot_id, url)
);

create index if not exists idx_spots_external_id on public.spots (external_id);
create index if not exists idx_spot_facilities_spot_id on public.spot_facilities (spot_id);
create index if not exists idx_spot_facilities_facility_id on public.spot_facilities (facility_id);
create index if not exists idx_photos_spot_id on public.photos (spot_id);
