-- Backfill Chinese fields with current English values as placeholders.
-- This keeps zh UI complete before human translation is finalized.
update public.destinations
set
  name_zh = coalesce(nullif(name_zh, ''), name),
  city_zh = coalesce(nullif(city_zh, ''), city),
  description_zh = coalesce(nullif(description_zh, ''), description)
where
  name_zh is null
  or name_zh = ''
  or city_zh is null
  or city_zh = ''
  or description_zh is null
  or description_zh = '';
