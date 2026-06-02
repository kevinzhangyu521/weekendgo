alter table public.destinations
  add column if not exists external_id text;

create unique index if not exists idx_destinations_external_id
  on public.destinations (external_id);

drop policy if exists "authenticated users can import destinations" on public.destinations;
create policy "authenticated users can import destinations"
on public.destinations
for all
to authenticated
using (true)
with check (true);
