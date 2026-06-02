alter table public.spot_submissions
add column if not exists is_locked boolean not null default false,
add column if not exists deleted_at timestamptz;

create index if not exists idx_spot_submissions_deleted_at on public.spot_submissions (deleted_at);

drop policy if exists "users can update own submission management fields" on public.spot_submissions;
create policy "users can update own submission management fields"
on public.spot_submissions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can permanently delete own expired submissions" on public.spot_submissions;
create policy "users can permanently delete own expired submissions"
on public.spot_submissions
for delete
to authenticated
using (auth.uid() = user_id and deleted_at is not null and deleted_at <= now() - interval '24 hours');
