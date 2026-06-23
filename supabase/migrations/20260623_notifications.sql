create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  type text not null,
  title text not null,
  content text not null,
  related_id text,
  related_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_role_created
  on public.notifications(role, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

create index if not exists idx_notifications_admin_unread
  on public.notifications(role, is_read, created_at desc)
  where role = 'admin';

alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    role = 'admin'
    and exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())
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
    and exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())
  )
)
with check (
  user_id = auth.uid()
  or (
    role = 'admin'
    and exists (select 1 from public.admin_users where admin_users.user_id = auth.uid())
  )
);

drop policy if exists "app can create notifications" on public.notifications;
create policy "app can create notifications"
on public.notifications
for insert
to anon, authenticated
with check (true);
