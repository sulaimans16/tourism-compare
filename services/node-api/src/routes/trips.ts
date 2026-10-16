import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  CreateSavedStay,
  CreateTrip,
  CreateTripItem,
  ReorderItems,
  UpdateTrip,
  UpdateTripDay,
  UpdateTripItem,
  type Destination,
} from '@tc/types';
import type { Deps } from '../deps.js';
import { requireUser } from '../lib/supabase.js';
import { agenciesFor, withRedirects } from '../services/agencies.js';
import { enrichTrip } from '../services/enrich.js';

type P = { id: string; dayId: string; itemId: string; stayId: string };

export function tripRoutes(app: FastifyInstance, deps: Deps) {
  const repo = async (req: FastifyRequest) => {
    const user = await requireUser(deps.db, req);
    return deps.tripsFor(user.token, user.id);
  };

  app.get('/trips', async (req) => ({ trips: await (await repo(req)).list() }));
  app.post('/trips', async (req, reply) => {
    const body = CreateTrip.parse(req.body);
    const r = await repo(req);
    await Promise.all([...new Set(body.destinationIds)].map((id) => deps.destinations.get(id)));
    return reply.status(201).send(await r.create(body));
  });
  app.get<{ Params: P }>('/trips/:id', async (req) => (await repo(req)).get(req.params.id));
  app.patch<{ Params: P }>('/trips/:id', async (req) => (await repo(req)).update(req.params.id, UpdateTrip.parse(req.body)));
  app.delete<{ Params: P }>('/trips/:id', async (req, reply) => {
    await (await repo(req)).remove(req.params.id);
    return reply.status(204).send();
  });

  app.patch<{ Params: P }>('/trips/:id/days/:dayId', async (req) => {
    const body = UpdateTripDay.parse(req.body);
    if (body.destinationId) await deps.destinations.get(body.destinationId);
    return (await repo(req)).updateDay(req.params.id, req.params.dayId, body);
  });
  app.post<{ Params: P }>('/trips/:id/days/:dayId/items', async (req, reply) => {
    const item = await (await repo(req)).addItem(req.params.id, req.params.dayId, CreateTripItem.parse(req.body));
    return reply.status(201).send(item);
  });
  app.put<{ Params: P }>('/trips/:id/days/:dayId/order', async (req) =>
    (await repo(req)).reorder(req.params.id, req.params.dayId, ReorderItems.parse(req.body).itemIds),
  );
  app.patch<{ Params: P }>('/trips/:id/items/:itemId', async (req) =>
    (await repo(req)).updateItem(req.params.id, req.params.itemId, UpdateTripItem.parse(req.body)),
  );
  app.delete<{ Params: P }>('/trips/:id/items/:itemId', async (req, reply) => {
    await (await repo(req)).removeItem(req.params.itemId);
    return reply.status(204).send();
  });

  app.post<{ Params: P }>('/trips/:id/stays', async (req, reply) => {
    const stay = await (await repo(req)).saveStay(req.params.id, CreateSavedStay.parse(req.body));
    return reply.status(201).send(stay);
  });
  app.delete<{ Params: P }>('/trips/:id/stays/:stayId', async (req, reply) => {
    await (await repo(req)).removeStay(req.params.id, req.params.stayId);
    return reply.status(204).send();
  });

  const tripDestinations = async (ids: string[]) => {
    const list = await Promise.all([...new Set(ids)].map((id) => deps.destinations.get(id)));
    return new Map<string, Destination>(list.map((d) => [d.id, d]));
  };

  app.get<{ Params: P }>('/trips/:id/enrich', async (req) => {
    const trip = await (await repo(req)).get(req.params.id);
    return enrichTrip(deps, trip, await tripDestinations(trip.days.map((d) => d.destinationId)));
  });

  /** Agencies for every destination on the trip, with tracked website links. */
  app.get<{ Params: P }>('/trips/:id/agencies', async (req) => {
    const trip = await (await repo(req)).get(req.params.id);
    const dests = await tripDestinations(trip.days.map((d) => d.destinationId));
    const groups = await Promise.all([...dests.values()].map((d) => agenciesFor(deps, d)));
    return { destinations: groups.map((g) => withRedirects(deps, g, trip.id)) };
  });
}
