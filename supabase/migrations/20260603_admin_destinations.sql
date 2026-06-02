drop policy if exists "admins can manage destinations" on public.destinations;
create policy "admins can manage destinations"
on public.destinations
for all
to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
