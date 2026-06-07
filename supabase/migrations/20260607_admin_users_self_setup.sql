create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admin_users
  add column if not exists email text,
  add column if not exists created_at timestamptz not null default now();

alter table public.admin_users enable row level security;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
  );
$$;

create or replace function public.has_any_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
  );
$$;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "first user or admins can create admin users" on public.admin_users;
create policy "first user or admins can create admin users"
on public.admin_users
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    not public.has_any_admin()
    or public.is_admin(auth.uid())
  )
);
