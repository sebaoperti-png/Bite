-- BITE v1, steps 3-5: what the app needs to publish meals, book them and chat.

-- Guests keep seeing a meal they booked even after the host cancels it (to see what happened)
create function public.is_guest_of(p_meal uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bookings where meal_id = p_meal and guest_id = auth.uid())
$$;
create policy "meals visible to their guests" on public.meals for select
  using (public.is_guest_of(id));

-- The host's short bio is shown on the meal page
create or replace view public.meal_cards with (security_invoker = true) as
  select m.*, p.name as host_name, p.photo_url as host_photo, p.verified as host_verified,
         public.seats_left(m.id) as seats_left,
         public.host_rating(m.host_id) as host_rating,
         public.host_reviews(m.host_id) as host_reviews,
         p.bio as host_bio
  from meals m join profiles p on p.id = m.host_id;

-- "Message the host" before booking: opens (or reuses) the conversation about one meal
create function public.start_conversation(p_meal uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_host uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select host_id into v_host from meals where id = p_meal and status = 'published';
  if v_host is null then raise exception 'meal not available'; end if;
  if v_host = auth.uid() then raise exception 'this is your own meal'; end if;
  insert into conversations (meal_id, host_id, guest_id) values (p_meal, v_host, auth.uid())
  on conflict (meal_id, guest_id) do nothing;
  select id into v_id from conversations where meal_id = p_meal and guest_id = auth.uid();
  return v_id;
end $$;
revoke execute on function public.start_conversation(uuid) from public, anon;
grant  execute on function public.start_conversation(uuid) to authenticated;

-- A host cannot shrink a meal below the seats already promised, nor move it into the past
create function public.check_meal_update() returns trigger language plpgsql as $$
declare v_taken int;
begin
  select coalesce(sum(seats), 0) into v_taken from bookings
   where meal_id = new.id and status in ('requested', 'confirmed');
  if new.seats < v_taken then raise exception 'you already have % guests for this meal', v_taken; end if;
  return new;
end $$;
create trigger meals_check_update before update of seats on public.meals
  for each row execute function public.check_meal_update();

-- When a host cancels a meal, every open booking is cancelled with it
create function public.cancel_bookings_of_cancelled_meal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update bookings set status = 'cancelled' where meal_id = new.id and status in ('requested', 'confirmed');
  end if;
  return new;
end $$;
create trigger meals_cancel_bookings after update of status on public.meals
  for each row execute function public.cancel_bookings_of_cancelled_meal();
