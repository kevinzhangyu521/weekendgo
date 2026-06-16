create table if not exists public.collected_spots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  source_url text not null,
  video_url text,
  creator_name text,
  name text not null,
  city text not null,
  address text,
  latitude numeric,
  longitude numeric,
  recommendation text not null,
  suitable_age text,
  min_kid_age integer not null default 0,
  is_family_friendly boolean not null default true,
  can_creek boolean not null default false,
  is_camping boolean not null default false,
  is_free boolean not null default false,
  parking_info text,
  safety_tips text,
  tags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collected_spots_status on public.collected_spots(status);
create index if not exists idx_collected_spots_city on public.collected_spots(city);
create index if not exists idx_collected_spots_tags on public.collected_spots using gin(tags);
create index if not exists idx_collected_spots_created_at on public.collected_spots(created_at desc);

alter table public.collected_spots enable row level security;

drop policy if exists "admins can manage collected spots" on public.collected_spots;
create policy "admins can manage collected spots"
on public.collected_spots
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
