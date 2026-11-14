-- Scenario test: host Anna, guests Ben and Cara, stranger Dan, and a visitor who is not signed in.
\set ON_ERROR_STOP on
insert into auth.users (id, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', '{"name":"Anna H.","news":true}'),
 ('00000000-0000-0000-0000-00000000000b', '{"name":"Ben G."}'),
 ('00000000-0000-0000-0000-00000000000c', '{"name":"Cara G."}'),
 ('00000000-0000-0000-0000-00000000000d', '{"name":"Dan S."}');

create function public.t_as(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u, false); end $$;
create function public.t_ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAIL: %', msg; end if; raise notice 'ok   %', msg; end $$;
-- the statement must raise an error
create function public.t_fails(stmt text, msg text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok   % [blocked: %]', msg, sqlerrm; return; end;
  raise exception 'FAIL: % (it was allowed)', msg;
end $$;
-- the statement must change no rows (RLS hides them)
create function public.t_nochange(stmt text, msg text) returns void language plpgsql as $$
declare n int;
begin
  begin execute stmt; get diagnostics n = row_count;
  exception when others then raise notice 'ok   % [blocked: %]', msg, sqlerrm; return; end;
  if n <> 0 then raise exception 'FAIL: % (% rows changed)', msg, n; end if;
  raise notice 'ok   % [0 rows]', msg;
end $$;
grant execute on all functions in schema public to authenticated, anon;

select t_ok((select count(*) from profiles) = 4, 'a profile is created on sign-up');
select t_ok((select name from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Anna H.', 'the sign-up name is copied');
select t_ok((select news from profiles where id = '00000000-0000-0000-0000-00000000000a') and not (select news from profiles where id = '00000000-0000-0000-0000-00000000000b'), 'the newsletter choice from sign-up is kept');

set role authenticated;

-- ===== safety first: a name, a photo and (for hosts) the house rules
select t_as('00000000-0000-0000-0000-00000000000a');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city)
  values (auth.uid(),'No photo yet','pickup',500,1,now()+interval '1 day','Aalen') $$, 'hosting needs a profile photo first');
update profiles set photo_url = 'data:image/jpeg;base64,AAAA' where id = auth.uid();
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city)
  values (auth.uid(),'No rules yet','pickup',500,1,now()+interval '1 day','Aalen') $$, 'hosting needs the house rules accepted');
update profiles set host_rules_at = now() where id = auth.uid();
select t_ok((select host_rules_at from profiles where id = auth.uid()) is null, 'the house-rules date cannot be faked by editing the profile');
select t_ok(accept_house_rules() is not null, 'Anna accepts the house rules');
select t_ok((select host_rules_at from profiles where id = auth.uid()) is not null, 'the acceptance is saved');
select t_as('00000000-0000-0000-0000-00000000000c');
update profiles set photo_url = 'data:image/jpeg;base64,CCCC' where id = auth.uid();
select t_as('00000000-0000-0000-0000-00000000000d');
update profiles set photo_url = 'data:image/jpeg;base64,DDDD' where id = auth.uid();

-- ===== Anna (host) publishes a dinner with 3 seats
select t_as('00000000-0000-0000-0000-00000000000a');
-- the price cap: groceries 24 € for 4 people (Anna + 3 guests) = 6 € each, cap 7 €
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city)
  values (auth.uid(),'No cost','eat-together',600,3,now()+interval '1 day','Aalen') $$, 'a paid meal needs its grocery cost');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Greedy','eat-together',800,3,now()+interval '1 day','Aalen','{"kind":"receipt","total":24,"people":4}', 'Lamb, onions, apricots, couscous', now()) $$, 'a price above the cap is refused (8 € > 7 €)');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Rounding profit','eat-together',500,9,now()+interval '1 day','Aalen','{"kind":"receipt","total":40,"people":10}', 'Lamb, onions, apricots, couscous', now()) $$, 'guests can never pay more than the groceries together (9 × 5 € > 40 €)');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Cents','eat-together',650,3,now()+interval '1 day','Aalen','{"kind":"receipt","total":24,"people":4}', 'Lamb, onions, apricots, couscous', now()) $$, 'the contribution is whole euros');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Odd proof','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"vibes","total":24,"people":4}', 'Lamb, onions, apricots, couscous', now()) $$, 'an unknown kind of cost is refused');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Huge','eat-together',2000,3,now()+interval '1 day','Aalen','{"kind":"receipt","total":5000,"people":4}', 'Lamb, onions, apricots, couscous', now()) $$, 'a grocery cost above 1000 € is refused');
select t_ok(public.price_cap_cents(4200, 4, 'receipt') = 900 and public.price_cap_cents(4000, 9, 'receipt') = 400 and public.price_cap_cents(400, 6, 'estimate') = 0, 'the database cap matches the app (42 €/5 → 9 €, 40 €/10 → 4 €, 4 €/7 → free)');
insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, status)
values (auth.uid(), 'Free soup', 'pickup', 0, 2, now() + interval '2 days', 'Aalen', 'draft');
select t_ok((select count(*) from meals where title = 'Free soup') = 1, 'a free meal needs no grocery cost');
delete from meals where title = 'Free soup';
-- ingredients and the host's declaration (0008)
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, host_declared_at)
  values (auth.uid(),'No ingredients','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"receipt","total":24,"people":4}', now()) $$, 'a published meal must list its ingredients');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients)
  values (auth.uid(),'No promise','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"receipt","total":24,"people":4}', 'Rice, beans') $$, 'a published meal needs the host''s declaration');
insert into meals (id, host_id, title, service_type, price_cents, seats, starts_at, city, area, cost_proof, ingredients, host_declared_at)
  values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a',
        'Tajine', 'eat-together', 600, 3, now() + interval '2 days', 'Aalen', 'Hirschbach', '{"kind":"receipt","total":24,"people":4}', 'Lamb, onions, apricots, couscous', now());
select t_fails($$ update meals set price_cents = 1500 where id = '11111111-1111-1111-1111-111111111111' $$, 'the host cannot raise the price above the cap later');
select t_fails($$ update meals set cost_proof = null where id = '11111111-1111-1111-1111-111111111111' $$, 'the host cannot remove the grocery cost later');
-- a typed total must be itemised (0009)
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Typed','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"declared","total":24,"people":4}', 'Rice, beans', now()) $$, 'a typed total without a shopping list is refused');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'One line','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"declared","total":24,"people":4,"lines":[{"item":"Groceries","price":24}]}', 'Rice, beans', now()) $$, 'one line ("groceries 24 €") is not a list');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
  values (auth.uid(),'Wrong sum','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"declared","total":24,"people":4,"lines":[{"item":"Rice","price":4},{"item":"Lamb","price":12}]}', 'Rice, lamb', now()) $$, 'a list that does not add up to the total is refused');
insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at, status)
  values (auth.uid(),'Listed','eat-together',600,3,now()+interval '1 day','Aalen','{"kind":"declared","total":24,"people":4,"lines":[{"item":"Rice","price":4.5},{"item":"Lamb","price":19.5}]}', 'Rice, lamb', now(), 'draft');
select t_ok((select count(*) from meals where title = 'Listed') = 1, 'a typed total with a list that adds up is accepted');
delete from meals where title = 'Listed';
select t_ok((select host_declared_at > now() - interval '1 minute' from meals where id = '11111111-1111-1111-1111-111111111111'), 'the declaration time is set by the database');
insert into meal_addresses values ('11111111-1111-1111-1111-111111111111', 'Brunnenstr. 1, Aalen');
update profiles set verified = true where id = auth.uid();
select t_ok((select verified from profiles where id = auth.uid()) = false, 'a user cannot mark themselves as verified');
update profiles set city = 'Aalen', country = 'Germany', notifications = false where id = auth.uid();
select t_ok((select city = 'Aalen' and not notifications from profiles where id = auth.uid()), 'Anna can save her own settings');
select t_fails($$ update profiles set photo_url = repeat('x', 500000) where id = auth.uid() $$, 'oversized profile photos are refused');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city)
  values ('00000000-0000-0000-0000-00000000000b','Fake','pickup',100,1,now()+interval '1 day','Aalen') $$,
  'Anna cannot publish a meal in Ben''s name');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'a host cannot book her own meal');
select t_fails($$ insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city)
  values (auth.uid(),'Too expensive','pickup',9000,1,now()+interval '1 day','Aalen') $$, 'price per plate is capped at 30 euro');

-- ===== Ben (guest)
select t_as('00000000-0000-0000-0000-00000000000b');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'booking needs a profile photo first');
update profiles set photo_url = 'data:image/jpeg;base64,BBBB' where id = auth.uid();
select t_ok((select count(*) from meal_cards) = 1, 'Ben sees the published meal');
select t_ok((select seats_left from meal_cards) = 3, 'seats left = 3');
select t_ok((select count(*) from meal_addresses) = 0, 'Ben cannot see the address before he is confirmed');
select t_nochange($$ update meals set price_cents = 1 $$, 'Ben cannot change Anna''s meal');
select t_nochange($$ delete from meals $$, 'Ben cannot delete Anna''s meal');
select t_fails($$ insert into bookings (meal_id, guest_id, seats, status, total_cents)
  values ('11111111-1111-1111-1111-111111111111', auth.uid(), 1, 'confirmed', 0) $$,
  'Ben cannot write a confirmed booking directly (must ask the host)');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 4) $$, 'Ben cannot book more seats than exist');
select request_booking('11111111-1111-1111-1111-111111111111', 2, 'Hi Anna! I am vegetarian, is that ok?');
select t_ok((select status from bookings) = 'requested', 'Ben''s booking starts as a request');
select t_ok((select total_cents from bookings) = 1200, 'total = 2 x 6.00, no Bite fee while payments are not in the app');
select t_ok((select count(*) from messages) = 1, 'Ben''s note arrives in the chat');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'Ben cannot book twice');
select t_nochange($$ update bookings set status = 'confirmed' $$, 'Ben cannot confirm his own booking');

-- ===== Cara wants 2 seats, only 1 left (Ben's request holds 2)
select t_as('00000000-0000-0000-0000-00000000000c');
select t_ok((select seats_left from meal_cards) = 1, 'a pending request already holds its seats');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 2) $$, 'Cara cannot overbook');
select t_ok((select count(*) from bookings) = 0, 'Cara cannot see Ben''s booking');
select t_ok((select count(*) from messages) = 0, 'Cara cannot read Ben''s chat');
select t_as('00000000-0000-0000-0000-00000000000a');
select set_config('t.conv', (select id::text from conversations), false);
select t_as('00000000-0000-0000-0000-00000000000c');
select t_fails($$ insert into messages (conversation_id, sender_id, body)
  values (current_setting('t.conv')::uuid, auth.uid(), 'spam') $$, 'Cara cannot write into Ben''s conversation');

-- ===== Anna answers
select t_as('00000000-0000-0000-0000-00000000000a');
select t_ok((select count(*) from bookings) = 1, 'Anna sees the request on her meal');
select t_ok((select count(*) from messages) = 1, 'Anna reads Ben''s note');
select answer_booking((select id from bookings), true);
select t_ok((select status from bookings) = 'confirmed', 'Anna accepts Ben');
select t_fails($$ select answer_booking((select id from bookings), false) $$, 'a request cannot be answered twice');
insert into messages (conversation_id, sender_id, body) select id, auth.uid(), 'Of course! See you Saturday.' from conversations;

-- ===== Ben, now confirmed
select t_as('00000000-0000-0000-0000-00000000000b');
select t_ok((select address from meal_addresses) = 'Brunnenstr. 1, Aalen', 'Ben sees the address once confirmed');
select t_ok((select count(*) from messages) = 2, 'Ben gets Anna''s reply');
select t_nochange($$ update messages set body = 'edited' $$, 'nobody can edit a message after sending');
select mark_read((select id from conversations));
select t_ok((select count(*) from messages where read_at is not null) = 1, 'Ben marks Anna''s reply as read (not his own)');
select t_fails($$ select review_booking((select id from bookings), 5) $$, 'Ben cannot review before the dinner');
select t_fails($$ select answer_booking((select id from bookings), true) $$, 'Ben cannot answer requests on Anna''s meal');

-- ===== Dan (stranger) sees nothing private
select t_as('00000000-0000-0000-0000-00000000000d');
select t_ok((select count(*) from bookings) = 0, 'Dan sees no bookings');
select t_ok((select count(*) from conversations) = 0, 'Dan sees no conversations');
select t_ok((select count(*) from meal_addresses) = 0, 'Dan sees no address');
select t_nochange($$ update profiles set name = 'hacked' where id = '00000000-0000-0000-0000-00000000000a' $$, 'Dan cannot edit Anna''s profile');

-- ===== Ben cancels, the seats come back, he can ask again
select t_as('00000000-0000-0000-0000-00000000000b');
select cancel_booking((select id from bookings));
select t_ok((select seats_left from meal_cards) = 3, 'seats return after a cancellation');
select t_ok((select count(*) from meal_addresses) = 0, 'after cancelling Ben no longer sees the address');
select request_booking('11111111-1111-1111-1111-111111111111', 1);
select t_ok((select status from bookings) = 'requested', 'Ben can ask again after cancelling');

-- ===== likes
insert into likes values (auth.uid(), '11111111-1111-1111-1111-111111111111');
select t_as('00000000-0000-0000-0000-00000000000d');
select t_ok((select count(*) from likes) = 0, 'likes are private');

-- ===== a visitor who is not signed in
reset role; set role anon; select t_as('');
select t_ok((select count(*) from meal_cards) = 1, 'visitors can browse meals');
select t_ok((select count(*) from meal_addresses) = 0, 'visitors see no address');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'visitors cannot book');

-- ===== review after the dinner
reset role;
update meals set starts_at = now() - interval '1 hour';
update bookings set status = 'confirmed';
set role authenticated; select t_as('00000000-0000-0000-0000-00000000000b');
select review_booking((select id from bookings), 5, 'Wonderful evening');
select t_ok((select host_rating from meal_cards) = 5.0, 'the rating shows on the host''s meals');
select t_as('00000000-0000-0000-0000-00000000000d');
select t_ok((select host_rating from meal_cards) = 5.0 and (select host_reviews from meal_cards) = 1, 'strangers also see the host''s rating');
select t_ok((select count(*) from bookings) = 0, 'but still no bookings');
select t_as('00000000-0000-0000-0000-00000000000b');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'past meals cannot be booked');
-- reviews both ways (0007)
select t_fails($$ select review_guest((select id from bookings), 5, 'me') $$, 'a guest cannot review themself as a guest');
select review_booking((select id from bookings), 4, repeat('x', 900));
select t_ok((select rating = 4 and length(comment) = 500 from reviews), 'a review can be changed, and long words are cut to 500');
select t_as('00000000-0000-0000-0000-00000000000a');
select review_guest((select id from bookings), 5, 'Lovely guest, brought dessert');
select t_ok((select rating from guest_rating('00000000-0000-0000-0000-00000000000b')) = 5.0, 'the host rates the guest, and other hosts can see the average');
select t_fails($$ select review_booking((select id from bookings), 1) $$, 'the host cannot review their own meal as a guest');
select t_as('00000000-0000-0000-0000-00000000000d');
select t_fails($$ select review_guest((select id from bookings b), 1, 'stranger') $$, 'a stranger cannot review a guest');
select t_ok((select count(*) from guest_reviews) = 0, 'a stranger cannot read reviews about a guest');
select t_ok((select count(*) from host_review_list('00000000-0000-0000-0000-00000000000a')) = 1 and (select author from host_review_list('00000000-0000-0000-0000-00000000000a')) = 'Ben', 'a host''s reviews are public with the guest''s first name only');
select t_as('00000000-0000-0000-0000-00000000000b');
select t_ok((select count(*) from guest_reviews) = 1, 'Ben can read what Anna wrote about him');
select t_ok((select count(*) from my_guest_reviews()) = 1 and (select author from my_guest_reviews()) = 'Anna', 'Ben sees his reviews as a guest, with the host''s first name');
-- following (0008)
insert into follows (follower_id, followee_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000a');
select t_ok((select count(*) from my_follows()) = 1 and (select name from my_follows()) = 'Anna H.', 'Ben follows Anna and sees her in his list');
select t_ok(follower_count('00000000-0000-0000-0000-00000000000a') = 1, 'Anna''s follower count is 1');
select t_fails($$ insert into follows (follower_id, followee_id) values (auth.uid(), auth.uid()) $$, 'nobody can follow themselves');
select t_fails($$ insert into follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a') $$, 'nobody can follow in someone else''s name');
select t_as('00000000-0000-0000-0000-00000000000a');
select t_ok((select count(*) from follows) = 0, 'Anna cannot see who follows her, only the number');
select t_as('00000000-0000-0000-0000-00000000000b');
delete from follows where followee_id = '00000000-0000-0000-0000-00000000000a';
select t_ok(follower_count('00000000-0000-0000-0000-00000000000a') = 0, 'Ben can unfollow');

-- ===== step 3-5 additions
reset role;
update meals set starts_at = now() + interval '3 days';
update bookings set status = 'cancelled';
set role authenticated;
select t_as('00000000-0000-0000-0000-00000000000d');
select t_ok(start_conversation('11111111-1111-1111-1111-111111111111') is not null, 'Dan can message the host before booking');
select t_ok(start_conversation('11111111-1111-1111-1111-111111111111') = (select id from conversations), 'asking again reuses the same conversation');
insert into messages (conversation_id, sender_id, body) select id, auth.uid(), 'Is it spicy?' from conversations;
select t_ok((select host_bio from meal_cards) is not null, 'the host bio is shown on the meal');
select t_as('00000000-0000-0000-0000-00000000000a');
select t_fails($$ select start_conversation('11111111-1111-1111-1111-111111111111') $$, 'a host cannot open a chat with herself');
select t_ok((select count(*) from messages where body = 'Is it spicy?') = 1, 'Anna receives Dan''s question');
select t_as('00000000-0000-0000-0000-00000000000c');
select request_booking('11111111-1111-1111-1111-111111111111', 2);
select t_as('00000000-0000-0000-0000-00000000000a');
select t_fails($$ update meals set seats = 1 $$, 'Anna cannot shrink the table below the guests already promised');
update meals set status = 'cancelled';
select t_as('00000000-0000-0000-0000-00000000000c');
select t_ok((select status from bookings) = 'cancelled', 'cancelling the meal cancels the guests'' bookings');
select t_ok((select count(*) from meals) = 1, 'Cara still sees the meal she had booked (to know it was cancelled)');
select t_as('00000000-0000-0000-0000-00000000000d');
select t_ok((select count(*) from meals) = 0, 'strangers no longer see a cancelled meal');

-- ===== reports and blocking
reset role;
update meals set status = 'published', starts_at = now() + interval '3 days';
update bookings set status = 'cancelled';
set role authenticated;
select t_as('00000000-0000-0000-0000-00000000000d');
insert into reports (reporter_id, meal_id, category, reason) values (auth.uid(), '11111111-1111-1111-1111-111111111111', 'hygiene', 'The kitchen photos look dirty');
select t_ok((select count(*) from reports) = 0, 'reports cannot be read back by the reporter (only Bite reads them)');
select t_fails($$ insert into reports (reporter_id, category, reason) values (auth.uid(), 'other', 'about nothing') $$, 'a report needs a meal, a person or a message');
select t_fails($$ insert into reports (reporter_id, user_id, category, reason) values (auth.uid(), auth.uid(), 'other', 'myself') $$, 'nobody can report themselves');
select t_fails($$ insert into reports (reporter_id, user_id, category, reason) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 'scam', 'in Ben''s name') $$, 'nobody can file a report in someone else''s name');
select t_fails($$ insert into reports (reporter_id, user_id, category, reason) select auth.uid(), '00000000-0000-0000-0000-00000000000a', 'other', 'spam ' || g from generate_series(1, 12) g $$, 'at most 10 reports a day');
reset role;
select t_ok((select status from reports limit 1) = 'open', 'Bite sees the report as open');
set role authenticated;
select t_as('00000000-0000-0000-0000-00000000000c');
select request_booking('11111111-1111-1111-1111-111111111111', 1);
select t_as('00000000-0000-0000-0000-00000000000a');
insert into blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000c');
select t_fails($$ insert into blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c') $$, 'nobody can block in someone else''s name');
select t_as('00000000-0000-0000-0000-00000000000c');
select t_ok((select status from bookings) = 'cancelled', 'blocking cancels the open booking between the two');
select t_ok((select count(*) from blocks) = 0, 'Cara cannot see that Anna blocked her');
select t_ok((select count(*) from meal_cards where status = 'published' and host_id = '00000000-0000-0000-0000-00000000000a') = 0, 'Cara no longer sees Anna''s meals in the list');
select t_fails($$ select request_booking('11111111-1111-1111-1111-111111111111', 1) $$, 'Cara cannot book Anna again');
select t_fails($$ insert into messages (conversation_id, sender_id, body) select id, auth.uid(), 'why?' from conversations $$, 'Cara cannot write to Anna any more');
select t_as('00000000-0000-0000-0000-00000000000a');
delete from blocks where blocked_id = '00000000-0000-0000-0000-00000000000c';
select t_as('00000000-0000-0000-0000-00000000000c');
select t_ok((select count(*) from meal_cards where host_id = '00000000-0000-0000-0000-00000000000a' and status = 'published') = 1, 'after unblocking, Cara sees Anna''s meals again');

\echo ALL TESTS PASSED
