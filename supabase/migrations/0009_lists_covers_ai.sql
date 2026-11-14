-- 0009 · A typed grocery total must be itemised, cover photos from Unsplash carry their credit, and a daily
--        allowance for the AI helpers (Gemini, called only by the Edge Function "bite-ai").
-- Apply after 0008 in the Supabase SQL editor.

-- 1. A total the host typed (kind "declared") is only fair if guests can see what it is made of: at least two
--    lines (what was bought, what it cost) that add up to the total. A scanned receipt or Bite's estimate needs no list.
create or replace function public.check_cost_lines() returns trigger language plpgsql set search_path = public as $$
declare v_lines jsonb; v_sum numeric := 0; v_line jsonb; v_price numeric;
begin
  if auth.uid() is null then return new; end if;                       -- Bite itself
  if new.price_cents = 0 or new.cost_proof is null or new.cost_proof->>'kind' <> 'declared' then return new; end if;
  v_lines := new.cost_proof->'lines';
  if v_lines is null or jsonb_typeof(v_lines) <> 'array' or jsonb_array_length(v_lines) < 2 then
    raise exception 'list what you bought (at least two items with their price)';
  end if;
  if jsonb_array_length(v_lines) > 40 then raise exception 'at most 40 items in the shopping list'; end if;
  for v_line in select * from jsonb_array_elements(v_lines) loop
    if length(trim(coalesce(v_line->>'item', ''))) < 2 or length(v_line->>'item') > 60 then
      raise exception 'every item in the shopping list needs a name';
    end if;
    begin v_price := (v_line->>'price')::numeric; exception when others then v_price := null; end;
    if v_price is null or v_price <= 0 or v_price > 500 then raise exception 'every item in the shopping list needs a price'; end if;
    v_sum := v_sum + v_price;
  end loop;
  if abs(v_sum - (new.cost_proof->>'total')::numeric) > 0.01 then
    raise exception 'the shopping list must add up to the total';
  end if;
  return new;
end $$;
drop trigger if exists meals_check_cost_lines on public.meals;
create trigger meals_check_cost_lines before insert or update of price_cents, cost_proof on public.meals
  for each row execute function public.check_cost_lines();

-- 2. Cover photos picked from Unsplash: the photographer's name and links, shown under the photo as Unsplash asks
alter table public.meals add column if not exists image_credit jsonb;
alter table public.meals drop constraint if exists meals_image_credit_small;
alter table public.meals add constraint meals_image_credit_small check (image_credit is null or (jsonb_typeof(image_credit) = 'object' and length(image_credit::text) <= 600));

drop view if exists public.meal_cards;
create view public.meal_cards with (security_invoker = true) as
  select m.*, p.name as host_name, p.photo_url as host_photo, p.verified as host_verified,
         public.seats_left(m.id) as seats_left,
         public.host_rating(m.host_id) as host_rating,
         public.host_reviews(m.host_id) as host_reviews,
         p.bio as host_bio
  from meals m join profiles p on p.id = m.host_id;
grant select on public.meal_cards to anon, authenticated;

-- 3. The AI helpers: each account may ask a limited number of times per day (the free Gemini quota is shared)
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null default current_date,
  n       int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;   -- no policies: only the Edge Function (service role) touches it

-- counts one use; false when today's allowance is used up
create or replace function public.ai_take(p_user uuid, p_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  insert into ai_usage (user_id, day, n) values (p_user, current_date, 1)
    on conflict (user_id, day) do update set n = ai_usage.n + 1
    returning n into v_n;
  delete from ai_usage where day < current_date - 7;    -- keep the table tiny
  return v_n <= p_limit;
end $$;
revoke execute on function public.ai_take(uuid, int) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, int) to service_role;
