create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('submission_approved', 'submission_rejected')),
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notifications_user_created
  on public.user_notifications(user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists "users can read own notifications" on public.user_notifications;
create policy "users can read own notifications"
on public.user_notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can update own notifications" on public.user_notifications;
create policy "users can update own notifications"
on public.user_notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can create notifications" on public.user_notifications;
create policy "admins can create notifications"
on public.user_notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);
