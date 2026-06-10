create table if not exists public.auth_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auth_sessions enable row level security;

drop policy if exists "users can read own auth sessions" on public.auth_sessions;
create policy "users can read own auth sessions"
on public.auth_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can delete own auth sessions" on public.auth_sessions;
create policy "users can delete own auth sessions"
on public.auth_sessions
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.save_auth_session(
  p_session_id uuid,
  p_user_id uuid,
  p_email text,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.auth_sessions (
    id,
    user_id,
    email,
    access_token,
    refresh_token,
    expires_at,
    updated_at
  )
  values (
    p_session_id,
    p_user_id,
    p_email,
    p_access_token,
    p_refresh_token,
    p_expires_at,
    now()
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    email = excluded.email,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at = excluded.expires_at,
    updated_at = now();
end;
$$;

create or replace function public.get_auth_session(p_session_id uuid)
returns table (
  user_id uuid,
  email text,
  access_token text,
  refresh_token text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.user_id,
    s.email,
    s.access_token,
    s.refresh_token,
    s.expires_at
  from public.auth_sessions s
  where s.id = p_session_id
    and s.expires_at > now()
  limit 1;
$$;

grant execute on function public.save_auth_session(uuid, uuid, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.get_auth_session(uuid) to anon, authenticated;
