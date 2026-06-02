create or replace view public.destinations_i18n_todo as
select
  id,
  name,
  name_zh,
  city,
  city_zh,
  description,
  description_zh,
  (name_zh is null or name_zh = '' or name_zh = name) as needs_name_translation,
  (city_zh is null or city_zh = '' or city_zh = city) as needs_city_translation,
  (description_zh is null or description_zh = '' or description_zh = description) as needs_description_translation
from public.destinations
where
  (name_zh is null or name_zh = '' or name_zh = name)
  or (city_zh is null or city_zh = '' or city_zh = city)
  or (description_zh is null or description_zh = '' or description_zh = description);
