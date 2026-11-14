-- 0010: "Ask Bite" on the website is answered by Gemini through the Edge Function bite-ask.
-- Visitors are anonymous, so the allowance is counted per hashed IP address (the hash changes every day,
-- the raw address is never stored) plus one shared daily ceiling for the whole site ('*').
create table if not exists public.ask_usage (
  key  text not null,                 -- sha-256 of (ip + day + secret salt), or '*' for the site total
  day  date not null default current_date,
  n    int  not null default 0,
  primary key (key, day)
);
alter table public.ask_usage enable row level security;   -- no policies: only the Edge Function (service role) touches it

-- counts one question; false when this visitor (p_limit) or the whole site (p_total) is over today's allowance
create or replace function public.ask_take(p_key text, p_limit int, p_total int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_n int; v_all int;
begin
  insert into ask_usage (key, day, n) values (p_key, current_date, 1)
    on conflict (key, day) do update set n = ask_usage.n + 1 returning n into v_n;
  insert into ask_usage (key, day, n) values ('*', current_date, 1)
    on conflict (key, day) do update set n = ask_usage.n + 1 returning n into v_all;
  delete from ask_usage where day < current_date - 2;     -- keep the table tiny
  return v_n <= p_limit and v_all <= p_total;
end $$;
revoke execute on function public.ask_take(text, int, int) from public, anon, authenticated;
grant execute on function public.ask_take(text, int, int) to service_role;
