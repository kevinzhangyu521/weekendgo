alter table public.feedbacks
  add column if not exists user_email text,
  add column if not exists user_name text,
  add column if not exists user_role text not null default 'guest';

create index if not exists idx_feedbacks_user_email_created
  on public.feedbacks(user_email, created_at desc);

alter table public.spot_submissions
  add column if not exists contact text,
  add column if not exists user_email text,
  add column if not exists user_name text,
  add column if not exists user_role text not null default 'user';

create index if not exists idx_spot_submissions_user_email_created
  on public.spot_submissions(user_email, created_at desc);
