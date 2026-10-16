import type { FastifyInstance } from 'fastify';
import { StaySearchQuery, StayType } from '@tc/types';
import { z } from 'zod';
import type { Deps } from '../deps.js';
import { redirectUrl } from '../lib/sign.js';

const OffersQuery = z.object({
  destination: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(1).max(30).default(2),
  children: z.coerce.number().int().min(0).max(20).default(0),
  type: StayType.default('hotel'),
  tripId: z.string().uuid().optional(),
});

export function stayRoutes(app: FastifyInstance, deps: Deps) {
  /** `destination` is a destination id from /destinations (e.g. "ooty"). */
  app.get('/stays/search', async (req) => {
    const q = StaySearchQuery.parse(req.query);
    const dest = await deps.destinations.get(q.destination);
    return deps.pricing.search({ ...q, destination: dest.searchQuery });
  });

  app.get<{ Params: { token: string } }>('/stays/:token/offers', async (req) => {
    const q = OffersQuery.parse(req.query);
    const dest = await deps.destinations.get(q.destination);
    const { tripId, ...rest } = q;
    const result = await deps.pricing.offers(req.params.token, { ...rest, destination: dest.searchQuery });
    const withRedirect = <T extends { platform: string; deepLink: string }>(o: T) => ({
      ...o,
      redirectUrl: redirectUrl(
        deps.cfg.PUBLIC_API_URL,
        { url: o.deepLink, kind: 'stay', platform: o.platform, tripId },
        deps.cfg.redirectSecret,
      ),
    });
    return {
      ...result,
      offers: result.offers.map(withRedirect),
      cheapest: result.cheapest ? withRedirect(result.cheapest) : null,
    };
  });
}
