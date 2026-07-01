alter table public.user_profiles
add column if not exists avatar_url text;

alter table public.user_profiles
add column if not exists bio text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read avatars" on storage.objects;
create policy "public can read avatars"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "users can upload own avatars" on storage.objects;
create policy "users can upload own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users can update own avatars" on storage.objects;
create policy "users can update own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
