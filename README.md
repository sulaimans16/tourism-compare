# Yatra Compare: Tamil Nadu trip planner

Plan a domestic trip, compare **live** stay prices across booking platforms, and contact local travel agencies.
We don't take bookings or payments: users are redirected to the platform or agency they choose.

1. **Itinerary**: day-by-day planner with live Google Places attractions, drag-and-drop ordering, Open-Meteo forecasts
   and Google Routes drive times between stops.
2. **Stay price comparison**: hotels and villas/homes via SerpApi Google Hotels. Prices come from Booking.com, Agoda,
   MakeMyTrip, Goibibo, Expedia, hotel-direct and others. One best offer per platform, the cheapest flagged,
   "Go to site" through a signed, logged redirect.
3. **Agencies**: after the itinerary is done, tour operators and travel agencies for each destination from Google
   Places (phone, WhatsApp for Indian mobiles, website, rating, hours). Tamil Nadu Tourism (TTDC) is pinned as the
   government option.

Nothing is mocked in the product. If an API key is missing, the services refuse to start. If an upstream quota is
exhausted, the user sees a clear error (`PROVIDER_QUOTA_EXCEEDED`) and never fabricated data.

## Architecture

```
apps/web  (React + Vite)  ─┐                         ┌─> Google Places API (New) / Routes API
apps/mobile (Expo RN)     ─┼─> services/node-api ────┼─> Open-Meteo
     │  @tc/core hooks     │   (Fastify, TS, BFF)    ├─> Supabase (Postgres + Auth, RLS)
     │  @tc/api-client     │          │              └─> Redis (optional cache)
     └─ Supabase Auth ─────┘          └──> services/java-pricing (Spring Boot 3, Java 21)
                                              ├─> SerpApi Google Hotels
                                              ├─> Redis / in-memory cache
                                              └─> Supabase price_snapshots
```

| Path | What |
| --- | --- |
| `apps/web` | React 19 + Vite + Tailwind + TanStack Query. Destination explorer, trip builder, stays compare drawer, agencies, print view |
| `apps/mobile` | Expo SDK 58 + expo-router app reusing `@tc/core` / `@tc/api-client` (destinations, stays compare, trips, agencies) |
| `packages/types` | zod schemas + TS types shared by every JS app and service |
| `packages/api-client` | Typed fetch client for node-api (works in browser, RN, Node) |
| `packages/core` | Platform-agnostic React hooks + INR/date formatting |
| `packages/contracts` | `pricing.openapi.yaml`: the contract between node-api and java-pricing |
| `services/node-api` | Public API: auth (Supabase JWT), destinations, attractions, agencies, trips CRUD, enrichment, stays proxy, `/go` redirects |
| `services/java-pricing` | Internal price engine: `PriceProvider` interface → `SerpApiGoogleHotelsProvider`, offer ranking, caching, snapshots |
| `supabase/` | Migrations (schema + RLS) and Tamil Nadu destination seed |
| `infra/docker-compose.yml`, `render.yaml` | Local stack and Render blueprint |

### Data sources & keys

| Need | Provider | Key |
| --- | --- | --- |
| Live stay prices across platforms (hotels + vacation rentals) | [SerpApi Google Hotels](https://serpapi.com/google-hotels-api) | `SERPAPI_API_KEY` (free tier: 250 searches/mo) |
| Attractions, photos, agencies (phone/website/rating/hours) | [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/op-overview) | `GOOGLE_MAPS_API_KEY` |
| Drive time/distance between stops | [Google Routes API](https://developers.google.com/maps/documentation/routes) | same key |
| Weather forecast (16 days) | [Open-Meteo](https://open-meteo.com/) | none |
| DB + auth | [Supabase](https://supabase.com) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

Booking.com, Agoda, MakeMyTrip and Airbnb don't offer open public search APIs. SerpApi's Google Hotels results are
how we get their live prices and deep links without partner contracts. To add more sources later (affiliate APIs such
as Booking.com Demand API or Agoda Affiliate), implement `PriceProvider` in `java-pricing`.

**Cost controls:** java-pricing caches searches for 30 min and offers for 20 min. node-api caches Places for 1–6 h
(only identifiers are stored in Postgres, per the Google Maps terms) and rate-limits to 120 requests/min/IP.

## Getting started

Prerequisites: Node 22 + pnpm 10, Java 21, Docker (optional), a Supabase project, and the API keys above.

```bash
cp .env.example .env               # fill in keys
pnpm install

# Database: apply schema + seed to your Supabase project
npx supabase link --project-ref <ref>
npx supabase db push               # runs supabase/migrations
psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # or paste seed.sql into the SQL editor

# Services
(cd services/java-pricing && set -a && . ../../.env && ./gradlew bootRun)   # :8090
pnpm --filter @tc/types --filter @tc/api-client --filter @tc/core build
pnpm --filter @tc/node-api dev     # :8080
pnpm --filter @tc/web dev          # :5173

# Mobile
cp apps/mobile/.env.example apps/mobile/.env && pnpm --filter @tc/mobile dev
```

Or run the backends in Docker: `docker compose -f infra/docker-compose.yml --env-file .env up --build`.

In Supabase Auth, enable **Email** (OTP) and optionally **Google**, and add `http://localhost:5173` plus your web
domain to the redirect URLs.

### Live smoke test

```bash
IN=$(date -d '+30 days' +%F); OUT=$(date -d '+32 days' +%F)
curl "localhost:8080/stays/search?destination=ooty&checkIn=$IN&checkOut=$OUT&adults=2&type=villa" | jq '.properties[0]'
curl "localhost:8080/stays/<propertyToken>/offers?destination=ooty&checkIn=$IN&checkOut=$OUT" | jq '.offers, .cheapest'
curl "localhost:8080/destinations/madurai/agencies" | jq '.agencies[] | {name, phone, website, rating}'
```

## Tests

```bash
pnpm turbo run typecheck test                      # all TS packages, node-api (Fastify inject) + core
(cd services/java-pricing && ./gradlew test)       # mapper, ranking, error mapping, controller
pnpm --filter @tc/web test:e2e                     # Playwright, API stubbed in the spec
E2E_LIVE=1 VITE_API_BASE_URL=http://localhost:8080 pnpm --filter @tc/web test:e2e   # against the live stack
```

The test doubles (SerpApi JSON fixtures, stubbed HTTP) exist only in test code. The app paths always call live
providers.

## Deployment

- **Web** → Vercel (`apps/web/vercel.json`; set root directory to `apps/web`) or Netlify. Set `VITE_*` env vars.
- **node-api + java-pricing + Redis** → Render (`render.yaml` blueprint). java-pricing is a private service; node-api
  reaches it over the private network. Fly.io or Cloud Run work with the same Dockerfiles.
- **Mobile** → EAS Build (`eas build`) with `EXPO_PUBLIC_*` vars.
- **Supabase** stays the system of record (trips, saved stays, price history, outbound clicks).

## API (node-api)

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/destinations`, `/destinations/:id`, `/destinations/:id/photo` | - |
| GET | `/destinations/:id/attractions?q=` | - |
| GET | `/destinations/:id/agencies` | - |
| GET | `/stays/search?destination=&checkIn=&checkOut=&adults=&children=&type=hotel\|villa&sort=&maxPrice=` | - |
| GET | `/stays/:token/offers?destination=&checkIn=&checkOut=&adults=&children=&type=&tripId=` | - |
| GET | `/go?u=&k=&p=&t=&s=` (signed redirect; unsigned URLs are rejected) | - |
| GET/POST | `/trips` | user |
| GET/PATCH/DELETE | `/trips/:id` | user |
| PATCH | `/trips/:id/days/:dayId` | user |
| POST | `/trips/:id/days/:dayId/items`; PUT `/trips/:id/days/:dayId/order` | user |
| PATCH/DELETE | `/trips/:id/items/:itemId` | user |
| POST/DELETE | `/trips/:id/stays[/:stayId]` | user |
| GET | `/trips/:id/enrich` (weather + drive legs), `/trips/:id/agencies` | user |

## Scaling to more states

Destinations are rows in `public.destinations`. Add rows (any state) to `supabase/seed.sql` or insert them directly,
and the whole app picks them up: search queries, attractions, stays and agencies are all driven by
`search_query`/`lat`/`lng`. State-level official tourism links live in `services/node-api/src/services/agencies.ts`.

## Known limitations

- Google Hotels needs an age per child; until the UI collects ages, children are sent as 8 years old
  (`SerpApiGoogleHotelsProvider.DEFAULT_CHILD_AGE`).
- Weather is only available for days within the 16-day forecast window.
- Final prices can change on the platform at checkout. The UI says so next to every comparison.
