create table if not exists public.destination_reviews (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(trim(content)) between 4 and 500),
  suitable_age text,
  parking_rating text,
  toilet_rating text,
  safety_note text,
  recommend boolean,
  visit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(destination_id, user_id)
);

alter table public.destination_reviews
  add column if not exists suitable_age text,
  add column if not exists parking_rating text,
  add column if not exists toilet_rating text,
  add column if not exists safety_note text,
  add column if not exists recommend boolean;

alter table public.destination_reviews
  drop constraint if exists destination_reviews_suitable_age_check,
  add constraint destination_reviews_suitable_age_check
    check (suitable_age is null or suitable_age in ('0-3', '3-6', '6-12', '12+'));

alter table public.destination_reviews
  drop constraint if exists destination_reviews_parking_rating_check,
  add constraint destination_reviews_parking_rating_check
    check (parking_rating is null or parking_rating in ('easy', 'normal', 'hard'));

alter table public.destination_reviews
  drop constraint if exists destination_reviews_toilet_rating_check,
  add constraint destination_reviews_toilet_rating_check
    check (toilet_rating is null or toilet_rating in ('good', 'normal', 'poor'));

alter table public.destination_reviews
  drop constraint if exists destination_reviews_safety_note_length_check,
  add constraint destination_reviews_safety_note_length_check
    check (safety_note is null or char_length(trim(safety_note)) <= 200);

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
