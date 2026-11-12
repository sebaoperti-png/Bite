-- BITE v1, safety before real guests: reports, blocking, house rules for hosts and a minimum profile.
-- Everything here is enforced by the database, so it holds even if someone talks to the API directly.

-- ---------------------------------------------------------------- reports
-- What was reported (a meal, a person or one chat message), why, and where it stands.
-- Bite reads them in the Supabase dashboard; reporters never see each other's reports.
alter table public.reports
  add column message_id uuid references public.messages(id) on delete set null,
  add column category   text not null default 'other'
    check (category in ('unsafe','hygiene','harassment','scam','no_show','inappropriate','other')),
  add column status     text not null default 'open' check (status in ('open','reviewing','closed'));
alter table public.reports
  add constraint reports_have_a_target check (meal_id is not null or user_id is not null or message_id is not null),
  add constraint reports_not_about_yourself check (user_id is null or user_id <> reporter_id);

-- no flooding: at most 10 reports a day per person
create function public.limit_reports() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'too many reports today';
  end if;
  new.status := 'open';   -- only Bite moves a report forward
  return new;
end $$;
create trigger reports_limit before insert on public.reports for each row execute function public.limit_reports();

-- ---------------------------------------------------------------- blocking
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "own blocks read"   on public.blocks for select using (blocker_id = auth.uid());
create policy "own blocks add"    on public.blocks for insert with check (blocker_id = auth.uid());
create policy "own blocks remove" on public.blocks for delete using (blocker_id = auth.uid());

-- true when either of the two blocked the other (works without seeing the other person's blocks)
create function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and exists (
    select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;

-- a block also cancels the open bookings between the two, for meals that have not happened yet
create function public.cancel_bookings_on_block() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update bookings b set status = 'cancelled'
    from meals m
   where m.id = b.meal_id and m.starts_at > now() and b.status in ('requested','confirmed')
     and ((b.guest_id = new.blocked_id and m.host_id = new.blocker_id)
       or (b.guest_id = new.blocker_id and m.host_id = new.blocked_id));
  return new;
end $$;
create trigger blocks_cancel_bookings after insert on public.blocks
  for each row execute function public.cancel_bookings_on_block();

-- blocked people stop seeing each other's meals, also the ones they had booked before
drop policy "published meals readable" on public.meals;
create policy "published meals readable" on public.meals for select
  using (host_id = auth.uid() or (status = 'published' and not public.is_blocked_between(host_id, auth.uid())));

drop policy "meals visible to their guests" on public.meals;
create policy "meals visible to their guests" on public.meals for select
  using (public.is_guest_of(id) and not public.is_blocked_between(host_id, auth.uid()));

-- and cannot write to each other any more
drop policy "send messages" on public.messages;
create policy "send messages" on public.messages for insert
  with check (sender_id = auth.uid() and exists (select 1 from conversations c
              where c.id = conversation_id and auth.uid() in (c.host_id, c.guest_id)
                and not public.is_blocked_between(c.host_id, c.guest_id)));

-- ---------------------------------------------------------------- house rules and a minimum profile
alter table public.profiles add column host_rules_at timestamptz;

-- the date is set only through accept_house_rules(), never by editing the profile
create or replace function public.keep_verified() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    new.verified := old.verified;
    if coalesce(current_setting('bite.accepting_rules', true), '') <> 'yes' then new.host_rules_at := old.host_rules_at; end if;
  end if;
  return new;
end $$;

create function public.accept_house_rules() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v timestamptz;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  perform set_config('bite.accepting_rules', 'yes', true);
  update profiles set host_rules_at = coalesce(host_rules_at, now()) where id = auth.uid() returning host_rules_at into v;
  perform set_config('bite.accepting_rules', '', true);
  return v;
end $$;
revoke execute on function public.accept_house_rules() from public, anon;
grant  execute on function public.accept_house_rules() to authenticated;

-- someone others can recognise: a name and a photo
create function public.profile_complete(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = p and length(trim(name)) >= 2 and photo_url is not null and photo_url <> '')
$$;

-- hosting needs a complete profile and the house rules
create function public.check_new_meal() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- Bite itself (service role) may do anything
  if not public.profile_complete(new.host_id) then raise exception 'add your name and a photo before you host'; end if;
  if (select host_rules_at from profiles where id = new.host_id) is null then raise exception 'please accept the house rules before you host'; end if;
  return new;
end $$;
create trigger meals_check_new before insert on public.meals for each row execute function public.check_new_meal();

-- booking needs a complete profile and no block between guest and host
create or replace function public.request_booking(p_meal uuid, p_seats int, p_note text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_meal meals; v_id uuid; v_conv uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not public.profile_complete(auth.uid()) then raise exception 'add your name and a photo before you book'; end if;
  select * into v_meal from meals where id = p_meal for update;
  if not found or v_meal.status <> 'published' then raise exception 'meal not available'; end if;
  if public.is_blocked_between(v_meal.host_id, auth.uid()) then raise exception 'meal not available'; end if;
  if v_meal.host_id = auth.uid() then raise exception 'you cannot book your own meal'; end if;
  if v_meal.starts_at < now() then raise exception 'this meal has already started'; end if;
  if seats_left(p_meal) < p_seats then raise exception 'not enough seats left'; end if;

  insert into bookings (meal_id, guest_id, seats, note, status, total_cents)
  values (p_meal, auth.uid(), p_seats, coalesce(p_note, ''), 'requested',
          round(v_meal.price_cents * p_seats * 1.12))
  on conflict (meal_id, guest_id) do update
    set seats = excluded.seats, note = excluded.note, status = 'requested',
        total_cents = excluded.total_cents, created_at = now()
    where bookings.status in ('cancelled','declined')
  returning id into v_id;
  if v_id is null then raise exception 'you already have a booking for this meal'; end if;

  insert into conversations (meal_id, host_id, guest_id) values (p_meal, v_meal.host_id, auth.uid())
  on conflict (meal_id, guest_id) do nothing;
  if length(trim(coalesce(p_note, ''))) > 0 then
    select id into v_conv from conversations where meal_id = p_meal and guest_id = auth.uid();
    insert into messages (conversation_id, sender_id, body) values (v_conv, auth.uid(), trim(p_note));
  end if;
  return v_id;
end $$;

-- a host cannot accept someone they blocked (or who blocked them) in the meantime
create or replace function public.answer_booking(p_booking uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_b bookings;
begin
  select b.* into v_b from bookings b join meals m on m.id = b.meal_id
   where b.id = p_booking and m.host_id = auth.uid() for update of b;
  if not found then raise exception 'booking not found'; end if;
  if v_b.status <> 'requested' then raise exception 'this request was already answered'; end if;
  if p_accept and public.is_blocked_between(auth.uid(), v_b.guest_id) then raise exception 'booking not found'; end if;
  update bookings set status = case when p_accept then 'confirmed' else 'declined' end where id = p_booking;
end $$;

-- "message the host" also respects blocks
create or replace function public.start_conversation(p_meal uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_host uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select host_id into v_host from meals where id = p_meal and status = 'published';
  if v_host is null or public.is_blocked_between(v_host, auth.uid()) then raise exception 'meal not available'; end if;
  if v_host = auth.uid() then raise exception 'this is your own meal'; end if;
  insert into conversations (meal_id, host_id, guest_id) values (p_meal, v_host, auth.uid())
  on conflict (meal_id, guest_id) do nothing;
  select id into v_id from conversations where meal_id = p_meal and guest_id = auth.uid();
  return v_id;
end $$;
