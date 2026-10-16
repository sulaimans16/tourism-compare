import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyRequest } from 'fastify';
import { LRUCache } from 'lru-cache';
import type { Config } from '../config.js';
import { unauthorized } from './errors.js';

export interface AuthedUser {
  id: string;
  email?: string;
  token: string;
}

export interface Db {
  /** Anonymous client: public tables only (destinations). */
  anon: SupabaseClient;
  /** Client acting as the signed-in user, so Postgres RLS applies. */
  asUser(token: string): SupabaseClient;
  /** Service-role client (null when not configured). Server-side writes only. */
  service: SupabaseClient | null;
  /** Resolves the bearer token to a user, or null for anonymous requests. */
  userFromRequest(req: FastifyRequest): Promise<AuthedUser | null>;
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export function createDb(cfg: Config): Db {
  const anon = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, opts);
  const service = cfg.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, opts)
    : null;
  // Supabase verifies the JWT (works for both legacy HS256 and asymmetric signing keys).
  const verified = new LRUCache<string, AuthedUser>({ max: 10_000, ttl: 60_000 });

  return {
    anon,
    service,
    asUser(token) {
      return createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        ...opts,
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    },
    async userFromRequest(req) {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) return null;
      const token = header.slice(7).trim();
      const hit = verified.get(token);
      if (hit) return hit;
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data.user) throw unauthorized();
      const user = { id: data.user.id, email: data.user.email, token };
      verified.set(token, user);
      return user;
    },
  };
}

export async function requireUser(db: Db, req: FastifyRequest): Promise<AuthedUser> {
  const user = await db.userFromRequest(req);
  if (!user) throw unauthorized();
  return user;
}
