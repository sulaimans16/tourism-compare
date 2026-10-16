-- Core schema for the travel planner.
-- Only identifiers (Google place_id, SerpApi property_token) and user-authored data are stored.
-- Third-party content (names, phones, prices) is fetched live, except price_snapshots which
-- record what a user saw at a point in time.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- destinations (search configuration, public) ----------
create table public.destinations (
  id text primary key,                 -- slug, e.g. 'ooty'
  name text not null,
  state text not null,
  region text,                         -- e.g. 'Nilgiris', 'Coastal'
  lat double precision not null,
  lng double precision not null,
  google_place_id text,                -- resolved lazily by node-api
  search_query text not null,          -- used for Places / hotel search, e.g. 'Ooty, Tamil Nadu'
  tags text[] not null default '{}',
  sort_order int not null default 100,
  active boolean not null default true
);

-- ---------- trips ----------
create type public.trip_status as enum ('draft', 'planned', 'archived');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  adults int not null default 2 check (adults between 1 and 30),
  children int not null default 0 check (children between 0 and 20),
  status public.trip_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index trips_user_idx on public.trips (user_id, start_date desc);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_date date not null,
  destination_id text not null references public.destinations (id),
  notes text,
  unique (trip_id, day_date)
);

create type public.trip_item_kind as enum ('attraction', 'stay', 'travel', 'note');

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  kind public.trip_item_kind not null,
  google_place_id text,
  title text not null,
  lat double precision,
  lng double precision,
  start_time time,
  duration_minutes int,
  sort_order int not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index trip_items_day_idx on public.trip_items (trip_day_id, sort_order);

create table public.saved_stays (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  destination_id text references public.destinations (id),
  property_token text not null,
  name text not null,
  property_type text not null default 'hotel',   -- hotel | villa
  check_in date not null,
  check_out date not null,
  chosen_platform text,
  price_at_save_inr numeric(12, 2),
  deep_link text,
  created_at timestamptz not null default now()
);
create index saved_stays_trip_idx on public.saved_stays (trip_id);

-- ---------- price history (written by java-pricing with service role) ----------
create table public.price_snapshots (
  id bigint generated always as identity primary key,
  property_token text not null,
  property_name text,
  platform text not null,
  nightly_inr numeric(12, 2),
  total_inr numeric(12, 2),
  check_in date not null,
  check_out date not null,
  adults int not null,
  children int not null default 0,
  fetched_at timestamptz not null default now()
);
create index price_snapshots_lookup_idx
  on public.price_snapshots (property_token, check_in, check_out, fetched_at desc);

-- ---------- outbound redirect log (written by node-api with service role) ----------
create table public.outbound_clicks (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  trip_id uuid references public.trips (id) on delete set null,
  kind text not null,                  -- 'stay' | 'agency'
  platform text,
  target_url text not null,
  created_at timestamptz not null default now()
);

-- ---------- updated_at ----------
create function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;
alter table public.saved_stays enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.outbound_clicks enable row level security;

create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

create policy "destinations public read" on public.destinations for select using (active);

create policy "trips owner all" on public.trips for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trip_days owner all" on public.trip_days for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

create policy "trip_items owner all" on public.trip_items for all
  using (exists (
    select 1 from public.trip_days d join public.trips t on t.id = d.trip_id
    where d.id = trip_day_id and t.user_id = auth.uid()))
  with check (exists (
    select 1 from public.trip_days d join public.trips t on t.id = d.trip_id
    where d.id = trip_day_id and t.user_id = auth.uid()));

create policy "saved_stays owner all" on public.saved_stays for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

-- Price history is readable by everyone (it is what the public APIs returned), writable only by service role.
create policy "price_snapshots public read" on public.price_snapshots for select using (true);
-- outbound_clicks: no policies => only service role can access.
