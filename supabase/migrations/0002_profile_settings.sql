-- BITE v1, step 2: profile settings used by the app (country, notification and newsletter switches).
alter table public.profiles
  add column country       text    not null default 'Germany',
  add column notifications boolean not null default true,
  add column news          boolean not null default false;

-- profile photos are small square JPEGs for now (stored inline); keep them small
alter table public.profiles
  add constraint profiles_photo_size check (photo_url is null or length(photo_url) < 400000),
  add constraint profiles_name_length check (length(name) <= 60),
  add constraint profiles_bio_length check (length(bio) <= 600);

-- take the name and the newsletter choice from the sign-up form
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, news)
  values (new.id,
          left(coalesce(new.raw_user_meta_data->>'name', ''), 60),
          coalesce((new.raw_user_meta_data->>'news')::boolean, false));
  return new;
end $$;
