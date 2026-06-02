insert into storage.buckets (id, name, public)
values ('spot-submission-photos', 'spot-submission-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read spot submission photos" on storage.objects;
create policy "public can read spot submission photos"
on storage.objects
for select
using (bucket_id = 'spot-submission-photos');

drop policy if exists "authenticated users can upload spot submission photos" on storage.objects;
create policy "authenticated users can upload spot submission photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'spot-submission-photos');
