-- 0006 · The price cap, enforced by the database (same rules as src/app/costing.ts)
-- A host's contribution per guest must come from the real grocery cost:
--   people = seats + 1 (the host pays their own share too), share = groceries ÷ people
--   cap    = the share + 5% (receipt or a total the host typed) or + 15% (Bite's estimate), rounded up to whole euros,
--            and never so high that the guests together pay more than the groceries.
-- A free meal (price 0) needs no proof. Bite itself (service role, no auth.uid()) is not checked.
-- Apply after 0005 in the Supabase SQL editor.

create or replace function public.price_cap_cents(p_total_cents integer, p_seats integer, p_kind text)
returns integer language sql immutable as $$
  select greatest(0, least(
    ceil((p_total_cents * (case when p_kind = 'estimate' then 1.15 else 1.05 end)) / (p_seats + 1) / 100.0 - 1e-9)::int * 100,
    floor(p_total_cents::numeric / p_seats / 100.0 + 1e-9)::int * 100
  ))
$$;

create or replace function public.check_meal_price() returns trigger language plpgsql set search_path = public as $$
declare v_kind text; v_total numeric; v_cents integer;
begin
  if auth.uid() is null then return new; end if;
  if new.price_cents = 0 then return new; end if;
  if new.price_cents % 100 <> 0 then raise exception 'the contribution must be whole euros'; end if;
  if new.cost_proof is null or jsonb_typeof(new.cost_proof) <> 'object' then
    raise exception 'a paid meal needs its grocery cost (receipt or estimate)';
  end if;
  v_kind := new.cost_proof->>'kind';
  if v_kind is null or v_kind not in ('receipt', 'declared', 'estimate') then raise exception 'unknown kind of grocery cost'; end if;
  begin v_total := (new.cost_proof->>'total')::numeric; exception when others then v_total := null; end;
  if v_total is null or v_total <= 0 or v_total > 1000 then raise exception 'the grocery cost must be between 0 and 1000 euro'; end if;
  v_cents := round(v_total * 100)::int;
  if new.price_cents > public.price_cap_cents(v_cents, new.seats, v_kind) then
    raise exception 'the price is above the cap of % euro per guest', public.price_cap_cents(v_cents, new.seats, v_kind) / 100;
  end if;
  return new;
end $$;

drop trigger if exists meals_check_price on public.meals;
create trigger meals_check_price before insert or update of price_cents, cost_proof, seats on public.meals
  for each row execute function public.check_meal_price();
