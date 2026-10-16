import { describe, expect, it } from 'vitest';
import { ApiClientError, createApiClient, qs } from './index.js';

describe('api-client', () => {
  it('builds query strings without empty values', () => {
    expect(qs({ a: 1, b: undefined, c: '', d: 'x y' })).toBe('?a=1&d=x+y');
  });

  it('sends bearer token and throws typed errors', async () => {
    let auth: string | undefined;
    const client = createApiClient({
      baseUrl: 'https://api.test/',
      getToken: () => 'tok',
      fetch: (async (_url: string, init: RequestInit) => {
        auth = (init.headers as Record<string, string>).Authorization;
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'nope' } }), { status: 401 });
      }) as typeof fetch,
    });
    await expect(client.trips.list()).rejects.toBeInstanceOf(ApiClientError);
    expect(auth).toBe('Bearer tok');
  });
});
