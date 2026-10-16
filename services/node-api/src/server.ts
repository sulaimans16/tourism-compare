import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { Redis } from 'ioredis';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import type { Deps } from './deps.js';
import { MemoryCache, RedisCache } from './lib/cache.js';
import { createDb } from './lib/supabase.js';
import { GooglePlacesClient } from './clients/googlePlaces.js';
import { GoogleRoutesClient } from './clients/googleRoutes.js';
import { OpenMeteoClient } from './clients/openMeteo.js';
import { PricingClient } from './clients/pricing.js';
import { supabaseDestinations } from './repos/destinations.js';
import { TripRepo } from './repos/trips.js';

// Respect HTTPS_PROXY/NO_PROXY for outbound calls (corporate networks, sandboxes).
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) setGlobalDispatcher(new EnvHttpProxyAgent());

const cfg = loadConfig();
const db = createDb(cfg);
const cache =
  cfg.CACHE_BACKEND === 'redis' && cfg.REDIS_URL ? new RedisCache(new Redis(cfg.REDIS_URL)) : new MemoryCache();

const deps: Deps = {
  cfg,
  cache,
  db,
  destinations: supabaseDestinations(db.anon),
  tripsFor: (token, userId) => new TripRepo(db.asUser(token), userId),
  places: new GooglePlacesClient(
    cfg.GOOGLE_MAPS_API_KEY,
    (name) => `${cfg.PUBLIC_API_URL.replace(/\/+$/, '')}/photos?name=${encodeURIComponent(name)}`,
  ),
  routes: new GoogleRoutesClient(cfg.GOOGLE_MAPS_API_KEY),
  weather: new OpenMeteoClient(),
  pricing: new PricingClient(cfg.PRICING_SERVICE_URL, cfg.PRICING_SERVICE_TOKEN),
  async logClick(c) {
    if (!db.service) return;
    const { error } = await db.service.from('outbound_clicks').insert({
      user_id: c.userId ?? null,
      trip_id: c.tripId ?? null,
      kind: c.kind,
      platform: c.platform ?? null,
      target_url: c.url,
    });
    if (error) throw new Error(error.message);
  },
};

const app = await buildApp(deps);
await app.listen({ port: cfg.PORT, host: cfg.HOST });
