alter table public.destinations
  add column if not exists ticket_price text;

alter table public.spot_submissions
  add column if not exists ticket_price text;

alter table public.collected_spots
  add column if not exists ticket_price text;

comment on column public.destinations.ticket_price is 'Ticket or entrance fee text shown on destination cards and detail pages.';
comment on column public.spot_submissions.ticket_price is 'Ticket or entrance fee text submitted by users.';
comment on column public.collected_spots.ticket_price is 'Ticket or entrance fee text recorded by admins during collection.';
