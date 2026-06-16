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
