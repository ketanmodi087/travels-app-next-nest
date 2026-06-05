create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('pending', 'confirmed', 'cancelled');
  end if;
end $$;

create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null,
  title varchar(120) not null,
  description text not null,
  location varchar(120) not null,
  price_cents integer not null check (price_cents > 0),
  currency varchar(3) not null default 'USD',
  itinerary jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date not null,
  guest_limit integer not null check (guest_limit > 0),
  images jsonb not null default '[]'::jsonb,
  share_slug varchar(120) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  visitor_name varchar(120) not null,
  visitor_email varchar(255) not null,
  guest_count integer not null check (guest_count > 0),
  special_requests text null,
  status booking_status not null default 'pending',
  total_price_cents integer not null check (total_price_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tours_location on tours(location);
create index if not exists idx_bookings_tour_status on bookings(tour_id, status);
