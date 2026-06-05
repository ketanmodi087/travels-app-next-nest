insert into tours (
  id,
  creator_id,
  title,
  description,
  location,
  price_cents,
  currency,
  itinerary,
  start_date,
  end_date,
  guest_limit,
  images,
  share_slug
)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Himalayan Sunrise Trail',
  'A 4-day trek with guided hikes and mountain-view camps.',
  'Manali, India',
  24900,
  'USD',
  '[{"day":1,"title":"Arrival and briefing"},{"day":2,"title":"Valley hike"},{"day":3,"title":"Summit sunrise"},{"day":4,"title":"Return"}]'::jsonb,
  '2026-08-12',
  '2026-08-16',
  12,
  '[]'::jsonb,
  'himalayan-sunrise'
)
on conflict (id) do nothing;

insert into bookings (
  id,
  tour_id,
  visitor_name,
  visitor_email,
  guest_count,
  special_requests,
  status,
  total_price_cents
)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Alex Walker',
  'alex.walker@example.com',
  2,
  'Need vegetarian meals',
  'pending',
  49800
)
on conflict (id) do nothing;
