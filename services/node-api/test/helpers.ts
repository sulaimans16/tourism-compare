import type { Destination } from '@tc/types';
import { loadConfig } from '../src/config.js';
import type { Deps } from '../src/deps.js';
import { MemoryCache } from '../src/lib/cache.js';
import { GooglePlacesClient } from '../src/clients/googlePlaces.js';
import { GoogleRoutesClient } from '../src/clients/googleRoutes.js';
import { OpenMeteoClient } from '../src/clients/openMeteo.js';
import { PricingClient } from '../src/clients/pricing.js';
import { HttpError } from '../src/lib/errors.js';

export const cfg = loadConfig({
  NODE_ENV: 'test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  GOOGLE_MAPS_API_KEY: 'gkey',
  PRICING_SERVICE_TOKEN: 'test-service-token-123',
  PUBLIC_API_URL: 'https://api.test',
});

export const ooty: Destination = {
  id: 'ooty',
  name: 'Ooty',
  state: 'Tamil Nadu',
  region: 'Nilgiris',
  lat: 11.41,
  lng: 76.69,
  searchQuery: 'Ooty, Tamil Nadu',
  tags: [],
};

/** Records outbound requests and answers them from a route table (test-only HTTP double). */
export function fakeFetch(routes: Record<string, (url: URL, init?: RequestInit) => unknown>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push({ url: url.toString(), init });
    const key = Object.keys(routes).find((k) => url.toString().includes(k));
    if (!key) return new Response(JSON.stringify({ error: { message: 'no route' } }), { status: 500 });
    const body = routes[key]!(url, init);
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { fn, calls };
}

export function makeDeps(fetchFn: typeof fetch, overrides: Partial<Deps> = {}): Deps & { clicks: unknown[] } {
  const clicks: unknown[] = [];
  return {
    cfg,
    cache: new MemoryCache(),
    db: {
      anon: null as never,
      service: null,
      asUser: () => null as never,
      userFromRequest: async () => null,
    },
    destinations: {
      list: async () => [ooty],
      get: async (id) => {
        if (id !== 'ooty') throw new HttpError(404, 'NOT_FOUND', 'Destination not found');
        return ooty;
      },
    },
    tripsFor: () => {
      throw new Error('not used');
    },
    places: new GooglePlacesClient('gkey', (n) => `https://api.test/photos?name=${encodeURIComponent(n)}`, fetchFn),
    routes: new GoogleRoutesClient('gkey', fetchFn),
    weather: new OpenMeteoClient(fetchFn),
    pricing: new PricingClient('http://pricing.local', cfg.PRICING_SERVICE_TOKEN, fetchFn),
    logClick: async (c) => {
      clicks.push(c);
    },
    clicks,
    ...overrides,
  };
}
