alter table public.destinations
  add column if not exists province text,
  add column if not exists province_zh text;

alter table public.spot_submissions
  add column if not exists province text,
  add column if not exists province_zh text;

alter table public.spots
  add column if not exists province text,
  add column if not exists province_zh text;

update public.destinations
set
  province = coalesce(nullif(province, ''), city),
  province_zh = coalesce(nullif(province_zh, ''), city_zh, city)
where province is null
  or province = ''
  or province_zh is null
  or province_zh = '';

update public.spot_submissions
set
  province = coalesce(nullif(province, ''), city),
  province_zh = coalesce(nullif(province_zh, ''), city_zh, city)
where province is null
  or province = ''
  or province_zh is null
  or province_zh = '';

update public.spots
set
  province = coalesce(nullif(province, ''), city),
  province_zh = coalesce(nullif(province_zh, ''), city_zh, city)
where province is null
  or province = ''
  or province_zh is null
  or province_zh = '';

create index if not exists idx_destinations_province on public.destinations(province);
create index if not exists idx_spot_submissions_province on public.spot_submissions(province);
create index if not exists idx_spots_province on public.spots(province);
