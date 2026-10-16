import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Deps } from '../deps.js';
import { HttpError } from '../lib/errors.js';
import { verify } from '../lib/sign.js';

const GoQuery = z.object({
  u: z.string().url(),
  k: z.enum(['stay', 'agency']),
  s: z.string().min(10),
  p: z.string().max(100).optional(),
  t: z.string().uuid().optional(),
});

/** Logs the hand-off and redirects to the booking platform / agency site. Only signed URLs are allowed. */
export function goRoutes(app: FastifyInstance, deps: Deps) {
  app.get('/go', async (req, reply) => {
    const q = GoQuery.parse(req.query);
    const target = { url: q.u, kind: q.k, platform: q.p, tripId: q.t } as const;
    if (!verify(target, q.s, deps.cfg.redirectSecret) || !/^https?:\/\//i.test(q.u)) {
      throw new HttpError(400, 'INVALID_REDIRECT', 'This link is invalid or has been tampered with');
    }
    const user = await deps.db.userFromRequest(req).catch(() => null);
    void deps
      .logClick({ userId: user?.id, tripId: q.t, kind: q.k, platform: q.p, url: q.u })
      .catch((e) => req.log.warn({ err: e }, 'click log failed'));
    reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
    return reply.redirect(q.u, 302);
  });
}
