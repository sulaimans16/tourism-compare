-- Tamil Nadu launch destinations. These are search *configuration* (what to query live),
-- not content: attractions, stays, prices and agencies are fetched from live APIs.
insert into public.destinations (id, name, state, region, lat, lng, search_query, tags, sort_order) values
  ('chennai',         'Chennai',         'Tamil Nadu', 'Coastal',        13.0827, 80.2707, 'Chennai, Tamil Nadu',         '{city,beach,heritage}', 10),
  ('mahabalipuram',   'Mahabalipuram',   'Tamil Nadu', 'Coastal',        12.6208, 80.1945, 'Mahabalipuram, Tamil Nadu',   '{heritage,beach,unesco}', 20),
  ('puducherry',      'Puducherry',      'Puducherry', 'Coastal',        11.9416, 79.8083, 'Puducherry',                  '{beach,french-quarter}', 30),
  ('ooty',            'Ooty',            'Tamil Nadu', 'Nilgiris',       11.4102, 76.6950, 'Ooty, Tamil Nadu',            '{hills,tea,villas}', 40),
  ('coonoor',         'Coonoor',         'Tamil Nadu', 'Nilgiris',       11.3530, 76.7959, 'Coonoor, Tamil Nadu',         '{hills,tea,villas}', 50),
  ('kodaikanal',      'Kodaikanal',      'Tamil Nadu', 'Palani Hills',   10.2381, 77.4892, 'Kodaikanal, Tamil Nadu',      '{hills,lake,villas}', 60),
  ('yercaud',         'Yercaud',         'Tamil Nadu', 'Shevaroy Hills', 11.7753, 78.2093, 'Yercaud, Tamil Nadu',         '{hills,coffee}', 70),
  ('yelagiri',        'Yelagiri',        'Tamil Nadu', 'Eastern Ghats',  12.5786, 78.6406, 'Yelagiri, Tamil Nadu',        '{hills,adventure}', 80),
  ('valparai',        'Valparai',        'Tamil Nadu', 'Anamalai Hills', 10.3270, 76.9554, 'Valparai, Tamil Nadu',        '{hills,wildlife,tea}', 90),
  ('madurai',         'Madurai',         'Tamil Nadu', 'Temple Towns',    9.9252, 78.1198, 'Madurai, Tamil Nadu',         '{temple,heritage,food}', 100),
  ('thanjavur',       'Thanjavur',       'Tamil Nadu', 'Temple Towns',   10.7870, 79.1378, 'Thanjavur, Tamil Nadu',       '{temple,unesco,heritage}', 110),
  ('tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', 'Temple Towns',   10.7905, 78.7047, 'Tiruchirappalli, Tamil Nadu', '{temple,heritage}', 120),
  ('rameswaram',      'Rameswaram',      'Tamil Nadu', 'Coastal',         9.2876, 79.3129, 'Rameswaram, Tamil Nadu',      '{temple,pilgrimage,beach}', 130),
  ('kanyakumari',     'Kanyakumari',     'Tamil Nadu', 'Coastal',         8.0883, 77.5385, 'Kanyakumari, Tamil Nadu',     '{beach,sunrise,pilgrimage}', 140)
on conflict (id) do update set
  name = excluded.name, state = excluded.state, region = excluded.region, lat = excluded.lat,
  lng = excluded.lng, search_query = excluded.search_query, tags = excluded.tags,
  sort_order = excluded.sort_order;
