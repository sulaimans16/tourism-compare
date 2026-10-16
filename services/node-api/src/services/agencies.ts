import type { Agency, Destination, DestinationAgencies } from '@tc/types';
import type { Deps } from '../deps.js';
import { cached } from '../lib/cache.js';
import { redirectUrl } from '../lib/sign.js';

/** Government source, always listed first. Contact details live on the official site. */
export const TTDC: Omit<Agency, 'placeId'> & { placeId: string } = {
  placeId: 'official:ttdc',
  name: 'Tamil Nadu Tourism Development Corporation (TTDC)',
  address: 'Official tours, packages and hotels by the Government of Tamil Nadu',
  rating: null,
  userRatingCount: null,
  phone: null,
  internationalPhone: null,
  whatsappUrl: null,
  website: 'https://www.tamilnadutourism.tn.gov.in/',
  googleMapsUri: null,
  openNow: null,
  weekdayHours: [],
  businessStatus: null,
  source: 'official',
};

/** Bayesian-ish score so a 5.0 with 3 reviews doesn't outrank a 4.6 with 900. */
export function agencyScore(a: Pick<Agency, 'rating' | 'userRatingCount'>): number {
  const r = a.rating ?? 0;
  const n = a.userRatingCount ?? 0;
  const prior = 4.0;
  const weight = 20;
  return (r * n + prior * weight) / (n + weight) + Math.log10(n + 1) * 0.05;
}

export function rankAgencies(lists: Agency[][]): Agency[] {
  const byId = new Map<string, Agency>();
  for (const a of lists.flat()) {
    if (a.businessStatus && a.businessStatus !== 'OPERATIONAL') continue;
    if (!a.phone && !a.website) continue; // nothing the user can act on
    if (!byId.has(a.placeId)) byId.set(a.placeId, a);
  }
  return [...byId.values()].sort((x, y) => agencyScore(y) - agencyScore(x));
}

export async function agenciesFor(deps: Deps, d: Destination, limit = 12): Promise<DestinationAgencies> {
  const agencies = await cached(deps.cache, `agencies:${d.id}`, 6 * 3600, async () => {
    const near = { lat: d.lat, lng: d.lng, radiusMeters: 30_000, pageSize: 20 };
    const [operators, agents] = await Promise.all([
      deps.places.searchAgencies({ ...near, query: `tour operators in ${d.searchQuery}`, includedType: 'travel_agency' }),
      deps.places.searchAgencies({ ...near, query: `travel agency taxi tour packages ${d.searchQuery}` }),
    ]);
    return rankAgencies([operators, agents.filter((a) => a.name)]);
  });
  return {
    destinationId: d.id,
    destinationName: d.name,
    agencies: [TTDC, ...agencies.slice(0, limit)],
  };
}

export function withRedirects(deps: Deps, group: DestinationAgencies, tripId?: string): DestinationAgencies {
  return {
    ...group,
    agencies: group.agencies.map((a) => ({
      ...a,
      websiteRedirectUrl: a.website
        ? redirectUrl(
            deps.cfg.PUBLIC_API_URL,
            { url: a.website, kind: 'agency', platform: a.name.slice(0, 100), tripId },
            deps.cfg.redirectSecret,
          )
        : null,
    })),
  };
}
