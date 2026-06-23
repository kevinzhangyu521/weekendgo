alter table public.spot_submissions
  add column if not exists published_destination_id uuid references public.destinations(id) on delete set null,
  add column if not exists allow_resubmit boolean not null default false;

alter table public.spot_submissions
  drop constraint if exists spot_submissions_status_check;

alter table public.spot_submissions
  add constraint spot_submissions_status_check
  check (status in ('pending', 'approved', 'needs_changes', 'rejected'));

create index if not exists idx_spot_submissions_published_destination
  on public.spot_submissions(published_destination_id);
