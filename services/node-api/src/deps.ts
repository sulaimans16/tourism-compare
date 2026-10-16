import type { Config } from './config.js';
import type { Cache } from './lib/cache.js';
import type { Db } from './lib/supabase.js';
import type { GooglePlacesClient } from './clients/googlePlaces.js';
import type { GoogleRoutesClient } from './clients/googleRoutes.js';
import type { OpenMeteoClient } from './clients/openMeteo.js';
import type { PricingClient } from './clients/pricing.js';
import type { DestinationRepo } from './repos/destinations.js';
import type { TripRepo } from './repos/trips.js';

export interface Deps {
  cfg: Config;
  cache: Cache;
  db: Db;
  destinations: DestinationRepo;
  tripsFor(token: string, userId: string): TripRepo;
  places: GooglePlacesClient;
  routes: GoogleRoutesClient;
  weather: OpenMeteoClient;
  pricing: PricingClient;
  /** Records an outbound click (best effort). */
  logClick(click: { userId?: string | null; tripId?: string | null; kind: string; platform?: string | null; url: string }): Promise<void>;
}
