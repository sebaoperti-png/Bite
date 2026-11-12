-- BITE v1: database schema for Supabase (Postgres)
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Principles
--  * Every table has Row Level Security: the browser only ever sees rows it is allowed to see.
--  * Changes that involve two people (book, accept, decline, cancel) go through functions
--    (security definer) so the rules live in one place and cannot be bypassed from the browser.
--  * The exact address of a dinner is stored apart and only shown to the host and confirmed guests.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null default '',
  bio          text not null default '',
  photo_url    text,
  dietary      text[] not null default '{}',
  city         text not null default '',
  postal_code  text not null default '',
  lang         text not null default 'en' check (lang in ('en','de')),
  -- set by Bite after the ID / video check, never by the user
  verified     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- a profile row is created automatically when someone signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- meals
create table public.meals (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (length(title) between 2 and 80),
  description   text not null default '',
  service_type  text not null check (service_type in ('pickup','eat-together','cook-together')),
  -- the host's contribution per plate, in cents; the 12% Bite fee is added at checkout
  price_cents   integer not null check (price_cents between 0 and 3000),
  seats         integer not null check (seats between 1 and 12),
  starts_at     timestamptz not null,
  city          text not null,
  area          text not null default '',      -- neighbourhood shown publicly ("Hirschbach, Aalen")
  lat           double precision,                -- approximate (rounded) point for distance search
  lng           double precision,
  tags          text[] not null default '{}',
  image_url     text,
  gallery       text[] not null default '{}',
  cost_proof    jsonb,                           -- {"kind":"receipt","total":18.40,"people":4}
  status        text not null default 'published' check (status in ('draft','published','cancelled')),
  created_at    timestamptz not null default now()
);
create index meals_upcoming on public.meals (starts_at) where status = 'published';
create index meals_host on public.meals (host_id);

-- exact address: only host and confirmed guests
create table public.meal_addresses (
  meal_id  uuid primary key references public.meals(id) on delete cascade,
  address  text not null
);

-- ---------------------------------------------------------------- bookings
create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  meal_id      uuid not null references public.meals(id) on delete cascade,
  guest_id     uuid not null references public.profiles(id) on delete cascade,
  seats        integer not null check (seats between 1 and 6),
  note         text not null default '',
  -- requested -> confirmed | declined ; confirmed -> cancelled
  status       text not null default 'requested' check (status in ('requested','confirmed','declined','cancelled')),
  total_cents  integer not null,                 -- what the guest pays: contribution + 12% fee
  paid_at      timestamptz,                      -- filled by the payment step (Stripe), later
  created_at   timestamptz not null default now(),
  unique (meal_id, guest_id)
);
create index bookings_guest on public.bookings (guest_id);

-- ---------------------------------------------------------------- chat
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null references public.meals(id) on delete cascade,
  host_id     uuid not null references public.profiles(id) on delete cascade,
  guest_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (meal_id, guest_id)
);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null check (length(body) between 1 and 2000),
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index messages_conv on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------- likes, reviews, reports
create table public.likes (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  meal_id  uuid not null references public.meals(id) on delete cascade,
  primary key (user_id, meal_id)
);

create table public.reviews (
  booking_id  uuid primary key references public.bookings(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now()
);

-- "Report a problem": safety first, every report is read by a person
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  meal_id      uuid references public.meals(id) on delete set null,
  user_id      uuid references public.profiles(id) on delete set null,
  reason       text not null check (length(reason) between 3 and 2000),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create function public.seats_left(p_meal uuid) returns integer
language sql stable security definer set search_path = public as $$
  select m.seats - coalesce((select sum(b.seats) from bookings b
                             where b.meal_id = m.id and b.status in ('requested','confirmed')), 0)::int
  from meals m where m.id = p_meal
$$;

create function public.is_meal_host(p_meal uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from meals where id = p_meal and host_id = auth.uid())
$$;

create function public.is_confirmed_guest(p_meal uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bookings where meal_id = p_meal and guest_id = auth.uid() and status = 'confirmed')
$$;

-- host rating, readable by everyone (bookings themselves stay private)
create function public.host_rating(p_host uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select round(avg(r.rating)::numeric, 1) from reviews r
    join bookings b on b.id = r.booking_id join meals m on m.id = b.meal_id
   where m.host_id = p_host
$$;
create function public.host_reviews(p_host uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from reviews r
    join bookings b on b.id = r.booking_id join meals m on m.id = b.meal_id
   where m.host_id = p_host
$$;

-- public list of dinners with seats left (what the Listings screen reads)
create view public.meal_cards with (security_invoker = true) as
  select m.*, p.name as host_name, p.photo_url as host_photo, p.verified as host_verified,
         public.seats_left(m.id) as seats_left,
         public.host_rating(m.host_id) as host_rating,
         public.host_reviews(m.host_id) as host_reviews
  from meals m join profiles p on p.id = m.host_id;

-- ---------------------------------------------------------------- actions (the only way to change bookings)
-- Guest asks for seats. The host decides ("you choose who sits at your table").
create function public.request_booking(p_meal uuid, p_seats int, p_note text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_meal meals; v_id uuid; v_conv uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into v_meal from meals where id = p_meal for update;
  if not found or v_meal.status <> 'published' then raise exception 'meal not available'; end if;
  if v_meal.host_id = auth.uid() then raise exception 'you cannot book your own meal'; end if;
  if v_meal.starts_at < now() then raise exception 'this meal has already started'; end if;
  if seats_left(p_meal) < p_seats then raise exception 'not enough seats left'; end if;

  -- a guest who cancelled or was declined may ask again: reuse the row
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

create function public.answer_booking(p_booking uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_b bookings;
begin
  select b.* into v_b from bookings b join meals m on m.id = b.meal_id
   where b.id = p_booking and m.host_id = auth.uid() for update of b;
  if not found then raise exception 'booking not found'; end if;
  if v_b.status <> 'requested' then raise exception 'this request was already answered'; end if;
  update bookings set status = case when p_accept then 'confirmed' else 'declined' end where id = p_booking;
end $$;

create function public.cancel_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update bookings set status = 'cancelled'
   where id = p_booking and guest_id = auth.uid() and status in ('requested','confirmed');
  if not found then raise exception 'booking not found'; end if;
end $$;

create function public.review_booking(p_booking uuid, p_rating int, p_comment text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from bookings b join meals m on m.id = b.meal_id
                  where b.id = p_booking and b.guest_id = auth.uid()
                    and b.status = 'confirmed' and m.starts_at < now()) then
    raise exception 'you can rate a meal after you attended it';
  end if;
  insert into reviews (booking_id, rating, comment) values (p_booking, p_rating, coalesce(p_comment, ''))
  on conflict (booking_id) do update set rating = excluded.rating, comment = excluded.comment;
end $$;

create function public.mark_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update messages m set read_at = now()
   from conversations c
  where m.conversation_id = p_conversation and c.id = p_conversation
    and auth.uid() in (c.host_id, c.guest_id) and m.sender_id <> auth.uid() and m.read_at is null
$$;

-- ---------------------------------------------------------------- row level security
alter table public.profiles       enable row level security;
alter table public.meals          enable row level security;
alter table public.meal_addresses enable row level security;
alter table public.bookings       enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.likes          enable row level security;
alter table public.reviews        enable row level security;
alter table public.reports        enable row level security;

-- profiles: public cards, edit only your own (verified cannot be changed by the user, see trigger)
create policy "profiles readable" on public.profiles for select using (true);
create policy "edit own profile"  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create function public.keep_verified() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then new.verified := old.verified; end if;  -- only the service role may change it
  return new;
end $$;
create trigger profiles_keep_verified before update on public.profiles
  for each row execute function public.keep_verified();

-- meals: everyone sees published meals, hosts manage their own
create policy "published meals readable" on public.meals for select
  using (status = 'published' or host_id = auth.uid());
create policy "host inserts own meals" on public.meals for insert with check (host_id = auth.uid());
create policy "host updates own meals" on public.meals for update using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "host deletes own meals" on public.meals for delete using (host_id = auth.uid());

-- address: host and confirmed guests only
create policy "address for host and guests" on public.meal_addresses for select
  using (public.is_meal_host(meal_id) or public.is_confirmed_guest(meal_id));
create policy "host writes address" on public.meal_addresses for insert with check (public.is_meal_host(meal_id));
create policy "host updates address" on public.meal_addresses for update using (public.is_meal_host(meal_id));

-- bookings: guest and host can read; changes only through the functions above
create policy "booking visible to guest and host" on public.bookings for select
  using (guest_id = auth.uid() or public.is_meal_host(meal_id));

-- chat: only the two people in the conversation
create policy "conversation participants" on public.conversations for select
  using (auth.uid() in (host_id, guest_id));
create policy "read messages" on public.messages for select
  using (exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.host_id, c.guest_id)));
create policy "send messages" on public.messages for insert
  with check (sender_id = auth.uid() and exists (select 1 from conversations c
              where c.id = conversation_id and auth.uid() in (c.host_id, c.guest_id)));
-- marking as read goes through mark_read(), so nobody can edit the text of a message

-- likes: your own
create policy "own likes read"   on public.likes for select using (user_id = auth.uid());
create policy "own likes add"    on public.likes for insert with check (user_id = auth.uid());
create policy "own likes remove" on public.likes for delete using (user_id = auth.uid());

-- reviews: public, written through review_booking()
create policy "reviews readable" on public.reviews for select using (true);

-- reports: write only; read in the Supabase dashboard
create policy "file a report" on public.reports for insert with check (reporter_id = auth.uid());

-- functions callable by signed-in users only
revoke execute on function public.request_booking(uuid, int, text) from public, anon;
revoke execute on function public.answer_booking(uuid, boolean)     from public, anon;
revoke execute on function public.cancel_booking(uuid)              from public, anon;
revoke execute on function public.review_booking(uuid, int, text)   from public, anon;
revoke execute on function public.mark_read(uuid)                   from public, anon;
grant  execute on function public.request_booking(uuid, int, text) to authenticated;
grant  execute on function public.answer_booking(uuid, boolean)     to authenticated;
grant  execute on function public.cancel_booking(uuid)              to authenticated;
grant  execute on function public.review_booking(uuid, int, text)   to authenticated;
grant  execute on function public.mark_read(uuid)                   to authenticated;

-- live chat updates
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.bookings;
