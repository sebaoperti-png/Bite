-- 0007 · Reviews both ways, with a few words
-- Guests rate the host (table `reviews`, since 0001) and now hosts rate their guests too (`guest_reviews`).
-- Only someone who was really at that dinner can review it: a confirmed booking, after the meal started.
-- A review can be changed later (one per booking and direction). Guests' ratings are shown only to hosts
-- deciding on a request (as an average), never as a public list. Apply after 0006 in the Supabase SQL editor.

-- a few words are welcome, a novel is not
alter table public.reviews drop constraint if exists reviews_comment_length;
alter table public.reviews add constraint reviews_comment_length check (length(comment) <= 500);

create table if not exists public.guest_reviews (
  booking_id  uuid primary key references public.bookings(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '' check (length(comment) <= 500),
  created_at  timestamptz not null default now()
);
alter table public.guest_reviews enable row level security;
-- the host who wrote it and the guest it is about can read it; everything else goes through functions
drop policy if exists "guest reviews readable by the two people" on public.guest_reviews;
create policy "guest reviews readable by the two people" on public.guest_reviews for select using (
  exists (select 1 from bookings b join meals m on m.id = b.meal_id
           where b.id = booking_id and auth.uid() in (b.guest_id, m.host_id)));

-- guest → host (replaces 0001's version: same rules, words trimmed)
create or replace function public.review_booking(p_booking uuid, p_rating int, p_comment text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from bookings b join meals m on m.id = b.meal_id
                  where b.id = p_booking and b.guest_id = auth.uid()
                    and b.status = 'confirmed' and m.starts_at < now()) then
    raise exception 'you can rate a meal after you attended it';
  end if;
  insert into reviews (booking_id, rating, comment) values (p_booking, p_rating, left(trim(coalesce(p_comment, '')), 500))
  on conflict (booking_id) do update set rating = excluded.rating, comment = excluded.comment;
end $$;

-- host → guest
create or replace function public.review_guest(p_booking uuid, p_rating int, p_comment text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from bookings b join meals m on m.id = b.meal_id
                  where b.id = p_booking and m.host_id = auth.uid()
                    and b.status = 'confirmed' and m.starts_at < now()) then
    raise exception 'you can rate a guest after the meal';
  end if;
  insert into guest_reviews (booking_id, rating, comment) values (p_booking, p_rating, left(trim(coalesce(p_comment, '')), 500))
  on conflict (booking_id) do update set rating = excluded.rating, comment = excluded.comment;
end $$;

-- what a host sees about a guest who asks for a seat: the average and how many dinners
create or replace function public.guest_rating(p_guest uuid)
returns table (rating numeric, reviews int) language sql stable security definer set search_path = public as $$
  select round(avg(g.rating)::numeric, 1), count(*)::int
    from guest_reviews g join bookings b on b.id = g.booking_id
   where b.guest_id = p_guest
$$;

-- the reviews on a host's page: first name of the guest, the dish, the words (newest first)
create or replace function public.host_review_list(p_host uuid)
returns table (rating int, comment text, created_at timestamptz, author text, author_photo text, meal_title text)
language sql stable security definer set search_path = public as $$
  select r.rating, r.comment, r.created_at, split_part(p.name, ' ', 1), p.photo_url, m.title
    from reviews r join bookings b on b.id = r.booking_id join meals m on m.id = b.meal_id
    join profiles p on p.id = b.guest_id
   where m.host_id = p_host
   order by r.created_at desc
   limit 30
$$;

revoke execute on function public.review_guest(uuid, int, text) from public, anon;
revoke execute on function public.guest_rating(uuid) from public, anon;
grant  execute on function public.review_guest(uuid, int, text) to authenticated;
grant  execute on function public.guest_rating(uuid) to authenticated;
grant  execute on function public.host_review_list(uuid) to anon, authenticated;

-- While payments are not in the app, Bite charges no fee: a booking's total is just the host's share × seats.
-- (Same function as in 0005, only the total changes.)
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
          v_meal.price_cents * p_seats)
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

