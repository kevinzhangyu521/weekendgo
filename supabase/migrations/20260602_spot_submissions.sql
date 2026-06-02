create table if not exists public.spot_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_zh text,
  city text not null,
  city_zh text,
  latitude double precision,
  longitude double precision,
  address text,
  scenario text not null check (scenario in ('camping', 'creek', 'hiking', 'picnic')),
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  safety text not null check (safety in ('low_risk', 'medium_risk', 'high_risk')),
  distance_km double precision not null default 0,
  min_kid_age integer not null default 0,
  has_parking boolean not null default false,
  has_toilet boolean not null default false,
  image_url text,
  description text not null default '',
  description_zh text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_spot_submissions_user_id on public.spot_submissions (user_id);
create index if not exists idx_spot_submissions_status on public.spot_submissions (status);

alter table public.spot_submissions enable row level security;

drop policy if exists "users can create spot submissions" on public.spot_submissions;
create policy "users can create spot submissions"
on public.spot_submissions
for insert
to authenticated
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can read own spot submissions" on public.spot_submissions;
create policy "users can read own spot submissions"
on public.spot_submissions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can manage spot submissions" on public.spot_submissions;
create policy "admins can manage spot submissions"
on public.spot_submissions
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
