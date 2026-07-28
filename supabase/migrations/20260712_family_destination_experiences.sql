create table if not exists public.family_destination_experiences (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  child_age_group text not null,
  visited_at date,
  recommendation text not null,
  tip text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_destination_experiences_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint family_destination_experiences_child_age_group_check
    check (child_age_group in ('0-3', '3-6', '6-12', '12+')),
  constraint family_destination_experiences_recommendation_length_check
    check (char_length(trim(recommendation)) between 4 and 300),
  constraint family_destination_experiences_tip_length_check
    check (char_length(trim(tip)) between 4 and 300)
);

create index if not exists idx_family_destination_experiences_destination_status_created
  on public.family_destination_experiences(destination_id, status, created_at desc);

create index if not exists idx_family_destination_experiences_user_created
  on public.family_destination_experiences(user_id, created_at desc);

create index if not exists idx_family_destination_experiences_status_created
  on public.family_destination_experiences(status, created_at desc);

alter table public.family_destination_experiences enable row level security;

drop policy if exists "public can read approved family destination experiences" on public.family_destination_experiences;
create policy "public can read approved family destination experiences"
on public.family_destination_experiences
for select
using (status = 'approved');

drop policy if exists "users can read own family destination experiences" on public.family_destination_experiences;
create policy "users can read own family destination experiences"
on public.family_destination_experiences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can read all family destination experiences" on public.family_destination_experiences;
create policy "admins can read all family destination experiences"
on public.family_destination_experiences
for select
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "users can create own pending family destination experiences" on public.family_destination_experiences;
create policy "users can create own pending family destination experiences"
on public.family_destination_experiences
for insert
to authenticated
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins can update family destination experiences" on public.family_destination_experiences;
create policy "admins can update family destination experiences"
on public.family_destination_experiences
for update
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "admins can delete family destination experiences" on public.family_destination_experiences;
create policy "admins can delete family destination experiences"
on public.family_destination_experiences
for delete
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'));
