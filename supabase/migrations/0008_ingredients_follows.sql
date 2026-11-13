-- 0008 · What's in it, the host's promise, and following people you liked
-- 1. Every new published meal lists all its ingredients and which of the 14 EU allergens it contains, and the host confirms a declaration before publishing
--    (ingredients and allergens complete and correct, hygiene, being there or cancelling early, own responsibility).
--    The time of that confirmation is set by the database, so it cannot be faked.
-- 2. "Follow": keep up with a neighbour you enjoyed eating with. Only you see whom you follow; anyone can see how many
--    followers a person has.
-- Apply after 0007 in the Supabase SQL editor.

alter table public.meals add column if not exists ingredients text not null default '';
alter table public.meals add column if not exists host_declared_at timestamptz;
-- the 14 allergens the EU names (Regulation 1169/2011, Annex II) that the meal contains, and the host's notes
alter table public.meals add column if not exists allergens text[] not null default '{}';
alter table public.meals add column if not exists allergy_notes text not null default '';
alter table public.meals drop constraint if exists meals_allergy_notes_length;
alter table public.meals add constraint meals_allergy_notes_length check (length(allergy_notes) <= 500);
alter table public.meals drop constraint if exists meals_allergens_known;
alter table public.meals add constraint meals_allergens_known check (allergens <@ array['gluten','crustaceans','eggs','fish','peanuts','soy','milk','nuts','celery','mustard','sesame','sulphites','lupin','molluscs']::text[]);
alter table public.meals drop constraint if exists meals_ingredients_length;
alter table public.meals add constraint meals_ingredients_length check (length(ingredients) <= 2000);

create or replace function public.check_meal_declaration() returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;            -- Bite itself
  if new.status <> 'published' then return new; end if;
  if length(trim(new.ingredients)) < 3 then raise exception 'list every ingredient of your meal'; end if;
  if new.host_declared_at is null then raise exception 'please confirm the host declaration before you publish'; end if;
  new.host_declared_at := now();                            -- the real moment, not what the browser says
  return new;
end $$;
drop trigger if exists meals_check_declaration on public.meals;
create trigger meals_check_declaration before insert on public.meals for each row execute function public.check_meal_declaration();

-- the meal cards now carry the ingredients (the view lists the meal's columns, so it is rebuilt)
drop view if exists public.meal_cards;
create view public.meal_cards with (security_invoker = true) as
  select m.*, p.name as host_name, p.photo_url as host_photo, p.verified as host_verified,
         public.seats_left(m.id) as seats_left,
         public.host_rating(m.host_id) as host_rating,
         public.host_reviews(m.host_id) as host_reviews,
         p.bio as host_bio
  from meals m join profiles p on p.id = m.host_id;
grant select on public.meal_cards to anon, authenticated;

-- following
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);
alter table public.follows enable row level security;
drop policy if exists "own follows read" on public.follows;
drop policy if exists "own follows add" on public.follows;
drop policy if exists "own follows remove" on public.follows;
create policy "own follows read"   on public.follows for select using (follower_id = auth.uid());
create policy "own follows add"    on public.follows for insert with check (follower_id = auth.uid() and not public.is_blocked_between(follower_id, followee_id));
create policy "own follows remove" on public.follows for delete using (follower_id = auth.uid());

-- blocking someone also ends following in both directions
create or replace function public.unfollow_on_block() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from follows where (follower_id = new.blocker_id and followee_id = new.blocked_id)
                         or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end $$;
drop trigger if exists blocks_unfollow on public.blocks;
create trigger blocks_unfollow after insert on public.blocks for each row execute function public.unfollow_on_block();

create or replace function public.follower_count(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from follows where followee_id = p_user
$$;
grant execute on function public.follower_count(uuid) to anon, authenticated;

-- the people you follow, with name and photo (profiles are readable anyway; this keeps it to one call)
create or replace function public.my_follows()
returns table (id uuid, name text, photo_url text, since timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.photo_url, f.created_at from follows f join profiles p on p.id = f.followee_id
   where f.follower_id = auth.uid() order by f.created_at desc
$$;
revoke execute on function public.my_follows() from public, anon;
grant execute on function public.my_follows() to authenticated;

-- what hosts wrote about you as a guest (you can read your own; this adds the host's first name and the dish)
create or replace function public.my_guest_reviews()
returns table (rating int, comment text, created_at timestamptz, author text, author_photo text, meal_title text)
language sql stable security definer set search_path = public as $$
  select g.rating, g.comment, g.created_at, split_part(p.name, ' ', 1), p.photo_url, m.title
    from guest_reviews g join bookings b on b.id = g.booking_id join meals m on m.id = b.meal_id
    join profiles p on p.id = m.host_id
   where b.guest_id = auth.uid()
   order by g.created_at desc
$$;
revoke execute on function public.my_guest_reviews() from public, anon;
grant execute on function public.my_guest_reviews() to authenticated;
