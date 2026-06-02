alter table public.destinations
  add column if not exists name_zh text,
  add column if not exists city_zh text,
  add column if not exists description_zh text;
