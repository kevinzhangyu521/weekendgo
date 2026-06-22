create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug', 'place_error', 'feature', 'experience', 'other')),
  content text not null,
  contact text,
  page_url text,
  device_type text,
  user_agent text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_status_created
  on public.feedbacks(status, created_at desc);

create index if not exists idx_feedbacks_type_created
  on public.feedbacks(type, created_at desc);

alter table public.feedbacks enable row level security;

drop policy if exists "anyone can create feedback" on public.feedbacks;
create policy "anyone can create feedback"
on public.feedbacks
for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can manage feedback" on public.feedbacks;
create policy "admins can manage feedback"
on public.feedbacks
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

alter table public.feedbacks
  add column if not exists feedback_no text,
  add column if not exists admin_reply text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists wechat_notify_reserved jsonb default '{}'::jsonb;

update public.feedbacks
set status = 'completed'
where status = 'resolved';

update public.feedbacks
set status_changed_at = coalesce(status_changed_at, updated_at, created_at)
where status_changed_at is null;

alter table public.feedbacks
  drop constraint if exists feedbacks_status_check;

alter table public.feedbacks
  add constraint feedbacks_status_check
  check (status in ('pending', 'in_progress', 'accepted', 'completed', 'rejected'));

create unique index if not exists idx_feedbacks_feedback_no
  on public.feedbacks(feedback_no)
  where feedback_no is not null;

create index if not exists idx_feedbacks_user_created
  on public.feedbacks(user_id, created_at desc);

drop policy if exists "users can read own feedback" on public.feedbacks;
create policy "users can read own feedback"
on public.feedbacks
for select
to authenticated
using (auth.uid() = user_id);
