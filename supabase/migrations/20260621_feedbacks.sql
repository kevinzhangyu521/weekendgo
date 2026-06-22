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
