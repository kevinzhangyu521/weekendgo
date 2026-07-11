create table if not exists public.family_experience_applications (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text,
  user_role text not null default 'guest',
  parent_name text not null,
  contact text not null,
  city text not null,
  children_age text,
  preferred_scenarios text[] not null default '{}'::text[],
  available_time text,
  family_size integer,
  message text,
  source_page_url text,
  device_type text,
  user_agent text,
  status text not null default 'pending',
  admin_note text,
  admin_reply text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_experience_applications_status_check
    check (status in ('pending', 'in_progress', 'approved', 'waitlisted', 'rejected', 'completed')),
  constraint family_experience_applications_family_size_check
    check (family_size is null or (family_size >= 1 and family_size <= 20))
);

create index if not exists idx_family_experience_applications_user_created
  on public.family_experience_applications(user_id, created_at desc);

create index if not exists idx_family_experience_applications_contact_created
  on public.family_experience_applications(contact, created_at desc);

create index if not exists idx_family_experience_applications_status_created
  on public.family_experience_applications(status, created_at desc);

alter table public.family_experience_applications enable row level security;

drop policy if exists "anyone can create family experience applications" on public.family_experience_applications;
create policy "anyone can create family experience applications"
on public.family_experience_applications
for insert
to anon, authenticated
with check (true);

drop policy if exists "users can read own family experience applications" on public.family_experience_applications;
create policy "users can read own family experience applications"
on public.family_experience_applications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admins can manage family experience applications" on public.family_experience_applications;
create policy "admins can manage family experience applications"
on public.family_experience_applications
for all
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));
