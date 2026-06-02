create index if not exists idx_destinations_filter_scenario on public.destinations(scenario);
create index if not exists idx_destinations_filter_difficulty on public.destinations(difficulty);
create index if not exists idx_destinations_filter_distance on public.destinations(distance_km);
create index if not exists idx_destinations_filter_has_parking on public.destinations(has_parking);
create index if not exists idx_destinations_filter_has_toilet on public.destinations(has_toilet);

create index if not exists idx_destinations_filter_combo
  on public.destinations(scenario, difficulty, distance_km);
