create table if not exists public.destination_reviews (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(trim(content)) between 4 and 500),
  visit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(destination_id, user_id)
);

create index if not exists idx_destination_reviews_destination_created
  on public.destination_reviews(destination_id, created_at desc);

create index if not exists idx_destination_reviews_user
  on public.destination_reviews(user_id);

alter table public.destination_reviews enable row level security;

drop policy if exists "public can read destination reviews" on public.destination_reviews;
create policy "public can read destination reviews"
on public.destination_reviews
for select
to anon, authenticated
using (true);

drop policy if exists "users can create own destination reviews" on public.destination_reviews;
create policy "users can create own destination reviews"
on public.destination_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own destination reviews" on public.destination_reviews;
create policy "users can update own destination reviews"
on public.destination_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own destination reviews" on public.destination_reviews;
create policy "users can delete own destination reviews"
on public.destination_reviews
for delete
to authenticated
using (auth.uid() = user_id);
