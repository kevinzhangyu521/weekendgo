alter table public.feedbacks
  add column if not exists replied_at timestamptz;

update public.feedbacks
set replied_at = coalesce(replied_at, updated_at, created_at)
where admin_reply is not null
  and btrim(admin_reply) <> ''
  and replied_at is null;

create index if not exists idx_feedbacks_replied_at
  on public.feedbacks(replied_at desc)
  where replied_at is not null;
