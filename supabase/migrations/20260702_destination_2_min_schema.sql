alter table public.destinations
  add column if not exists address text,
  add column if not exists opening_hours text,
  add column if not exists suitable_age_min integer,
  add column if not exists suitable_age_max integer,
  add column if not exists suggested_duration text,
  add column if not exists family_budget text,
  add column if not exists reservation_required boolean not null default false,
  add column if not exists parking_detail text,
  add column if not exists toilet_detail text,
  add column if not exists stroller_friendly boolean,
  add column if not exists pet_friendly boolean,
  add column if not exists best_time text,
  add column if not exists editor_recommendation text,
  add column if not exists family_tips text,
  add column if not exists avoid_pitfalls text;

create table if not exists public.destination_photos (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  image_url text not null,
  category text not null default 'gallery',
  alt_text text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destination_photos_category_check
    check (category in ('cover', 'gallery', 'play', 'parking', 'toilet', 'food', 'camping', 'water'))
);

create index if not exists destination_photos_destination_idx
  on public.destination_photos(destination_id, sort_order, created_at);

create unique index if not exists destination_photos_one_cover_per_destination
  on public.destination_photos(destination_id)
  where is_cover = true;

insert into public.destination_photos (
  destination_id,
  image_url,
  category,
  alt_text,
  is_cover,
  sort_order,
  created_at,
  updated_at
)
select
  destinations.id,
  destinations.image,
  'cover',
  coalesce(destinations.name_zh, destinations.name),
  true,
  0,
  now(),
  now()
from public.destinations destinations
where nullif(trim(destinations.image), '') is not null
  and not exists (
    select 1
    from public.destination_photos photos
    where photos.destination_id = destinations.id
      and photos.is_cover = true
  )
  and not exists (
    select 1
    from public.destination_photos photos
    where photos.destination_id = destinations.id
      and photos.image_url = destinations.image
  );

alter table public.home_recommendations
  add column if not exists recommendation text,
  add column if not exists custom_title text,
  add column if not exists custom_cover_image text;

alter table public.destination_photos enable row level security;

drop policy if exists "Public can read destination photos" on public.destination_photos;
create policy "Public can read destination photos"
on public.destination_photos
for select
using (
  exists (
    select 1
    from public.destinations destinations
    where destinations.id = destination_photos.destination_id
      and destinations.is_active = true
  )
);

drop policy if exists "Admins can manage destination photos" on public.destination_photos;
create policy "Admins can manage destination photos"
on public.destination_photos
for all
to authenticated
using (public.current_user_role() in ('admin', 'super_admin'))
with check (public.current_user_role() in ('admin', 'super_admin'));
