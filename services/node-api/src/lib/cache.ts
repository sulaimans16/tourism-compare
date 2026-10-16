import { LRUCache } from 'lru-cache';
import type { Redis } from 'ioredis';

/** Small TTL cache for upstream responses (Google data is cached briefly only, per Maps ToS). */
export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

export class MemoryCache implements Cache {
  private lru = new LRUCache<string, { v: unknown }>({ max: 5000 });
  async get<T>(key: string) {
    return this.lru.get(key)?.v as T | undefined;
  }
  async set<T>(key: string, value: T, ttlSeconds: number) {
    this.lru.set(key, { v: value }, { ttl: ttlSeconds * 1000 });
  }
}

export class RedisCache implements Cache {
  constructor(private redis: Redis) {}
  async get<T>(key: string) {
    try {
      const raw = await this.redis.get(`api:${key}`);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  }
  async set<T>(key: string, value: T, ttlSeconds: number) {
    try {
      await this.redis.set(`api:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* degrade to no cache */
    }
  }
}

export async function cached<T>(cache: Cache, key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = await cache.get<T>(key);
  if (hit !== undefined) return hit;
  const fresh = await load();
  await cache.set(key, fresh, ttl);
  return fresh;
}
