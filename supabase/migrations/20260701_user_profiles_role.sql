alter table public.user_profiles
  add column if not exists role text not null default 'user';

alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

create index if not exists user_profiles_role_idx
  on public.user_profiles(role);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.user_profiles
      where user_id = auth.uid()
      limit 1
    ),
    'user'
  );
$$;

grant execute on function public.current_user_role() to anon, authenticated;

insert into public.user_profiles (user_id, nickname, role, created_at, updated_at)
select
  admin_users.user_id,
  coalesce(auth_users.email, ''),
  'admin',
  now(),
  now()
from public.admin_users
left join auth.users auth_users on auth_users.id = admin_users.user_id
on conflict (user_id) do update
set role = case
    when public.user_profiles.role = 'super_admin' then 'super_admin'
    else 'admin'
  end,
  updated_at = now();

create or replace function public.claim_first_admin_profile()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (
    select 1
    from public.user_profiles
    where role in ('admin', 'super_admin')
  ) then
    return false;
  end if;

  insert into public.user_profiles (user_id, nickname, role, created_at, updated_at)
  values (
    auth.uid(),
    coalesce((select email from auth.users where id = auth.uid()), ''),
    'admin',
    now(),
    now()
  )
  on conflict (user_id) do update
  set role = 'admin',
      updated_at = now();

  return true;
end;
$$;

grant execute on function public.claim_first_admin_profile() to authenticated;

drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id and role = 'user');

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and role = public.current_user_role());

drop policy if exists "admins can manage destinations" on public.destinations;
create policy "admins can manage destinations"
on public.destinations
for all
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "admins can manage spot submissions" on public.spot_submissions;
create policy "admins can manage spot submissions"
on public.spot_submissions
for all
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));

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
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    role = 'admin'
    and public.current_user_role() in ('admin', 'super_admin')
  )
);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or (
    role = 'admin'
    and public.current_user_role() in ('admin', 'super_admin')
  )
)
with check (
  user_id = auth.uid()
  or (
    role = 'admin'
    and public.current_user_role() in ('admin', 'super_admin')
  )
);
