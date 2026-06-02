-- 1) Create a temporary staging table for translation import
create temporary table if not exists tmp_destinations_i18n_import (
  id text not null,
  name_zh text,
  city_zh text,
  description_zh text
);

-- 2) Import CSV into tmp table
-- In Supabase SQL editor, use "Import Data" for tmp_destinations_i18n_import
-- and map columns:
-- id, name_zh, city_zh, description_zh

-- 3) Upsert translated fields into production table
update public.destinations d
set
  name_zh = coalesce(nullif(t.name_zh, ''), d.name_zh),
  city_zh = coalesce(nullif(t.city_zh, ''), d.city_zh),
  description_zh = coalesce(nullif(t.description_zh, ''), d.description_zh)
from tmp_destinations_i18n_import t
where d.id::text = t.id;

-- 4) Verify import result
select
  id,
  name,
  name_zh,
  city,
  city_zh,
  left(description, 40) as description_preview,
  left(description_zh, 40) as description_zh_preview
from public.destinations
order by id;
