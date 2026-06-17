alter table public.destinations
  add column if not exists is_active boolean not null default true;

create index if not exists destinations_is_active_idx
  on public.destinations (is_active);
