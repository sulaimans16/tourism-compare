import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { cfg, fakeFetch, makeDeps } from './helpers.js';
import { redirectUrl } from '../src/lib/sign.js';

describe('stays', () => {
  it('maps destination id to search query and forwards the service token', async () => {
    const f = fakeFetch({
      '/v1/stays/search': () => ({ properties: [], nextPageToken: null, fetchedAt: 'now', provider: 'x' }),
    });
    const app = await buildApp(makeDeps(f.fn), { logger: false });
    const res = await app.inject(
      '/stays/search?destination=ooty&checkIn=2026-12-01&checkOut=2026-12-03&adults=2&type=villa',
    );
    expect(res.statusCode).toBe(200);
    const call = new URL(f.calls[0]!.url);
    expect(call.searchParams.get('destination')).toBe('Ooty, Tamil Nadu');
    expect(call.searchParams.get('type')).toBe('villa');
    expect((f.calls[0]!.init!.headers as Record<string, string>)['X-Service-Token']).toBe(cfg.PRICING_SERVICE_TOKEN);
  });

  it('adds signed redirect urls to every offer', async () => {
    const offer = { platform: 'Agoda', deepLink: 'https://agoda.com/x', cheapest: true, totalInr: 9000 };
    const f = fakeFetch({
      '/offers': () => ({ propertyToken: 'T', name: 'H', offers: [offer], cheapest: offer }),
    });
    const app = await buildApp(makeDeps(f.fn), { logger: false });
    const res = await app.inject('/stays/T/offers?destination=ooty&checkIn=2026-12-01&checkOut=2026-12-03');
    const body = res.json();
    expect(body.offers[0].redirectUrl).toMatch(/^https:\/\/api\.test\/go\?/);
    expect(body.cheapest.redirectUrl).toBe(body.offers[0].redirectUrl);
  });

  it('propagates quota errors from the pricing service', async () => {
    const f = fakeFetch({
      '/v1/stays/search': () =>
        new Response(JSON.stringify({ error: { code: 'PROVIDER_QUOTA_EXCEEDED', message: 'quota' } }), { status: 429 }),
    });
    const app = await buildApp(makeDeps(f.fn), { logger: false });
    const res = await app.inject('/stays/search?destination=ooty&checkIn=2026-12-01&checkOut=2026-12-03');
    expect(res.statusCode).toBe(429);
    expect(res.json().error.code).toBe('PROVIDER_QUOTA_EXCEEDED');
  });

  it('rejects unknown destinations', async () => {
    const app = await buildApp(makeDeps(fakeFetch({}).fn), { logger: false });
    const res = await app.inject('/stays/search?destination=atlantis&checkIn=2026-12-01&checkOut=2026-12-03');
    expect(res.statusCode).toBe(404);
  });
});

describe('/go redirect', () => {
  it('redirects signed links and logs the click', async () => {
    const deps = makeDeps(fakeFetch({}).fn);
    const app = await buildApp(deps, { logger: false });
    const link = redirectUrl('https://api.test', { url: 'https://booking.com/h', kind: 'stay', platform: 'Booking.com' }, cfg.redirectSecret);
    const res = await app.inject(link.replace('https://api.test', ''));
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('https://booking.com/h');
    await new Promise((r) => setTimeout(r, 0));
    expect(deps.clicks).toHaveLength(1);
  });

  it('refuses tampered links (no open redirect)', async () => {
    const app = await buildApp(makeDeps(fakeFetch({}).fn), { logger: false });
    const link = redirectUrl('https://api.test', { url: 'https://booking.com/h', kind: 'stay' }, cfg.redirectSecret);
    const res = await app.inject(link.replace('https://api.test', '').replace('booking.com', 'evil.example'));
    expect(res.statusCode).toBe(400);
  });
});

describe('agencies', () => {
  it('returns TTDC first then ranked, actionable Google results', async () => {
    const f = fakeFetch({
      'places:searchText': (_u, init) => {
        const body = JSON.parse(String(init!.body));
        expect((init!.headers as Record<string, string>)['X-Goog-FieldMask']).toContain('places.nationalPhoneNumber');
        if (body.includedType === 'travel_agency') {
          return {
            places: [
              { id: 'a', displayName: { text: 'Few Reviews' }, rating: 5, userRatingCount: 2, nationalPhoneNumber: '0423 000', businessStatus: 'OPERATIONAL' },
              { id: 'b', displayName: { text: 'Popular Tours' }, rating: 4.6, userRatingCount: 900, internationalPhoneNumber: '+91 98430 12345', nationalPhoneNumber: '098430 12345', websiteUri: 'https://popular.example', businessStatus: 'OPERATIONAL' },
              { id: 'c', displayName: { text: 'Closed' }, rating: 4.9, userRatingCount: 500, websiteUri: 'https://c', businessStatus: 'CLOSED_PERMANENTLY' },
            ],
          };
        }
        return { places: [{ id: 'd', displayName: { text: 'No contact' }, rating: 4.9, userRatingCount: 50 }, { id: 'b', displayName: { text: 'Popular Tours' } }] };
      },
    });
    const app = await buildApp(makeDeps(f.fn), { logger: false });
    const res = await app.inject('/destinations/ooty/agencies');
    expect(res.statusCode).toBe(200);
    const names = res.json().agencies.map((a: { name: string }) => a.name);
    expect(names[0]).toMatch(/TTDC/);
    expect(names.slice(1)).toEqual(['Popular Tours', 'Few Reviews']);
    const popular = res.json().agencies[1];
    expect(popular.whatsappUrl).toBe('https://wa.me/919843012345');
    expect(popular.websiteRedirectUrl).toMatch(/\/go\?/);
  });
});

describe('attractions', () => {
  it('queries Places near the destination and proxies photos', async () => {
    const f = fakeFetch({
      'places:searchText': (_u, init) => {
        const body = JSON.parse(String(init!.body));
        expect(body.textQuery).toBe('top tourist attractions in Ooty, Tamil Nadu');
        expect(body.locationBias.circle.center.latitude).toBe(11.41);
        return { places: [{ id: 'p1', displayName: { text: 'Botanical Garden' }, photos: [{ name: 'places/p1/photos/abc' }] }] };
      },
    });
    const app = await buildApp(makeDeps(f.fn), { logger: false });
    const res = await app.inject('/destinations/ooty/attractions');
    const place = res.json().places[0];
    expect(place.name).toBe('Botanical Garden');
    expect(place.photoUrl).toBe('https://api.test/photos?name=places%2Fp1%2Fphotos%2Fabc');
  });

  it('rejects malformed photo names', async () => {
    const app = await buildApp(makeDeps(fakeFetch({}).fn), { logger: false });
    const res = await app.inject('/photos?name=../../etc');
    expect(res.statusCode).toBe(400);
  });
});

describe('trips', () => {
  it('requires auth', async () => {
    const app = await buildApp(makeDeps(fakeFetch({}).fn), { logger: false });
    expect((await app.inject('/trips')).statusCode).toBe(401);
  });
});

describe('base path', () => {
  it('mounts every route under API_BASE_PATH', async () => {
    const deps = makeDeps(fakeFetch({}).fn);
    const app = await buildApp({ ...deps, cfg: { ...deps.cfg, API_BASE_PATH: '/api' } }, { logger: false });
    expect((await app.inject('/api/health')).statusCode).toBe(200);
    expect((await app.inject('/api/destinations')).statusCode).toBe(200);
    expect((await app.inject('/destinations')).statusCode).toBe(404);
  });
});
