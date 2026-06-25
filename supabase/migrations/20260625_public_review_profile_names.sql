alter table public.user_profiles
add column if not exists avatar_url text;

drop function if exists public.get_public_review_profile_names(uuid[]);

create function public.get_public_review_profile_names(user_ids uuid[])
returns table (
  user_id uuid,
  nickname text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select p.user_id, p.nickname, p.avatar_url
  from public.user_profiles p
  where p.user_id = any(user_ids)
    and nullif(trim(p.nickname), '') is not null;
$$;

grant execute on function public.get_public_review_profile_names(uuid[]) to anon, authenticated;
