import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Deps } from './deps.js';
import { errorHandler } from './lib/errors.js';
import { destinationRoutes } from './routes/destinations.js';
import { goRoutes } from './routes/go.js';
import { stayRoutes } from './routes/stays.js';
import { tripRoutes } from './routes/trips.js';

export async function buildApp(deps: Deps, opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? true,
    trustProxy: true,
    ajv: { customOptions: { coerceTypes: true } },
  });

  await app.register(cors, {
    origin: deps.cfg.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  });
  // Live price + Places lookups cost money: keep per-IP limits conservative.
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  app.setErrorHandler(errorHandler);
  app.get('/health', async () => ({ ok: true }));

  destinationRoutes(app, deps);
  stayRoutes(app, deps);
  goRoutes(app, deps);
  tripRoutes(app, deps);

  return app;
}
