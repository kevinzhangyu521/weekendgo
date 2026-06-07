update public.destinations
set image = 'https://commons.wikimedia.org/wiki/Special:FilePath/%E6%9C%A8%E5%85%B0%E8%8D%89%E5%8E%9F%E9%A3%8E%E6%99%AF%E5%8C%BA%E5%A4%A7%E9%97%A8_-_panoramio.jpg?width=1400',
    updated_at = now()
where external_id = 'wuhan-camping-mulan-grassland'
   or name ilike '%mulan grassland%'
   or name_zh like '%木兰草原%';

update public.destinations
set image = 'https://commons.wikimedia.org/wiki/Special:FilePath/Wuhan_East_Lake_01.jpg?width=1400',
    updated_at = now()
where external_id = 'wuhan-picnic-east-lake-greenway'
   or name ilike '%east lake%'
   or name_zh like '%东湖%';

update public.destinations
set image = '',
    updated_at = now()
where image ilike '%images.unsplash.com%'
  and not (
    external_id = 'wuhan-camping-mulan-grassland'
    or external_id = 'wuhan-picnic-east-lake-greenway'
    or name ilike '%mulan grassland%'
    or name ilike '%east lake%'
    or name_zh like '%木兰草原%'
    or name_zh like '%东湖%'
  );
