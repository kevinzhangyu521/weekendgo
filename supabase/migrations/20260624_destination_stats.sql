create table if not exists public.destination_stats (
  destination_id uuid primary key references public.destinations(id) on delete cascade,
  favorite_count integer not null default 0,
  view_count integer not null default 0,
  share_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.destination_stats enable row level security;

drop policy if exists "public can read destination stats" on public.destination_stats;
create policy "public can read destination stats"
on public.destination_stats
for select
using (true);

insert into public.destination_stats (destination_id, favorite_count, updated_at)
select destination_id, count(*)::integer, now()
from public.favorites
group by destination_id
on conflict (destination_id) do update
set favorite_count = excluded.favorite_count,
    updated_at = now();

create or replace function public.sync_destination_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.destination_stats (destination_id, favorite_count, updated_at)
    values (new.destination_id, 1, now())
    on conflict (destination_id) do update
    set favorite_count = public.destination_stats.favorite_count + 1,
        updated_at = now();
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.destination_stats (destination_id, favorite_count, updated_at)
    values (old.destination_id, 0, now())
    on conflict (destination_id) do update
    set favorite_count = greatest(public.destination_stats.favorite_count - 1, 0),
        updated_at = now();
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_destination_favorite_count on public.favorites;
create trigger trg_sync_destination_favorite_count
after insert or delete on public.favorites
for each row execute function public.sync_destination_favorite_count();

create or replace function public.increment_destination_view(destination_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.destination_stats (destination_id, view_count, updated_at)
  values (destination_id_input, 1, now())
  on conflict (destination_id) do update
  set view_count = public.destination_stats.view_count + 1,
      updated_at = now();
$$;

create or replace function public.increment_destination_share(destination_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.destination_stats (destination_id, share_count, updated_at)
  values (destination_id_input, 1, now())
  on conflict (destination_id) do update
  set share_count = public.destination_stats.share_count + 1,
      updated_at = now();
$$;

grant execute on function public.increment_destination_view(uuid) to anon, authenticated;
grant execute on function public.increment_destination_share(uuid) to anon, authenticated;
