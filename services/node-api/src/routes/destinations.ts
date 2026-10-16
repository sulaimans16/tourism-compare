import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Deps } from '../deps.js';
import { cached } from '../lib/cache.js';
import { agenciesFor, withRedirects } from '../services/agencies.js';

export function destinationRoutes(app: FastifyInstance, deps: Deps) {
  app.get('/destinations', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=300');
    return { destinations: await cached(deps.cache, 'destinations', 300, () => deps.destinations.list()) };
  });

  app.get<{ Params: { id: string } }>('/destinations/:id', async (req) => deps.destinations.get(req.params.id));

  /** Hero photo for a destination: the top Places result's first photo. */
  app.get<{ Params: { id: string } }>('/destinations/:id/photo', async (req, reply) => {
    const d = await deps.destinations.get(req.params.id);
    const photoUrl = await cached(deps.cache, `dest-photo:${d.id}`, 12 * 3600, async () => {
      const { places } = await deps.places.searchPlaces({ query: d.searchQuery, lat: d.lat, lng: d.lng, pageSize: 1 });
      return places[0]?.photoUrl ?? null;
    });
    if (!photoUrl) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'No photo' } });
    return reply.redirect(photoUrl, 302);
  });

  const AttractionsQuery = z.object({
    q: z.string().max(100).optional(),
    pageToken: z.string().optional(),
  });

  /** Live attractions from Google Places, optionally filtered by a free-text query. */
  app.get<{ Params: { id: string } }>('/destinations/:id/attractions', async (req) => {
    const d = await deps.destinations.get(req.params.id);
    const { q, pageToken } = AttractionsQuery.parse(req.query);
    const query = q ? `${q} in ${d.searchQuery}` : `top tourist attractions in ${d.searchQuery}`;
    return cached(deps.cache, `attr:${d.id}:${query}:${pageToken ?? ''}`, 3600, () =>
      deps.places.searchPlaces({
        query,
        includedType: q ? undefined : 'tourist_attraction',
        lat: d.lat,
        lng: d.lng,
        radiusMeters: 40_000,
        pageToken,
      }),
    );
  });

  app.get<{ Params: { id: string } }>('/destinations/:id/agencies', async (req) => {
    const d = await deps.destinations.get(req.params.id);
    return withRedirects(deps, await agenciesFor(deps, d));
  });

  /** Photo proxy so the Google API key never reaches clients. */
  app.get('/photos', async (req, reply) => {
    const { name, w } = z
      .object({ name: z.string().max(500), w: z.coerce.number().int().min(100).max(1600).default(800) })
      .parse(req.query);
    const uri = await cached(deps.cache, `photo:${name}:${w}`, 3600, () => deps.places.photoUri(name, w));
    reply.header('Cache-Control', 'public, max-age=3600');
    return reply.redirect(uri, 302);
  });
}
