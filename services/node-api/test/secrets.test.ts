import { describe, expect, it } from 'vitest';
import { loadVaultSecrets } from '../src/secrets.js';

const vault = (rows: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(rows), { status })) as unknown as typeof fetch;

const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc' };

describe('loadVaultSecrets', () => {
  it('fills only missing keys; env wins', async () => {
    const env: NodeJS.ProcessEnv = { ...base, GOOGLE_MAPS_API_KEY: 'from-env' };
    const loaded = await loadVaultSecrets(env, vault([
      { name: 'GOOGLE_MAPS_API_KEY', value: 'from-vault' },
      { name: 'PRICING_SERVICE_TOKEN', value: 'tok' },
    ]));
    expect(env.GOOGLE_MAPS_API_KEY).toBe('from-env');
    expect(env.PRICING_SERVICE_TOKEN).toBe('tok');
    expect(loaded).toEqual(['PRICING_SERVICE_TOKEN']);
  });

  it('calls the RPC with the service role key', async () => {
    let auth = '';
    const f = (async (_u: string, init: RequestInit) => {
      auth = (init.headers as Record<string, string>).Authorization!;
      return new Response('[]');
    }) as unknown as typeof fetch;
    await loadVaultSecrets({ ...base }, f);
    expect(auth).toBe('Bearer svc');
  });

  it('skips Vault without a service role key', async () => {
    expect(await loadVaultSecrets({ SUPABASE_URL: 'https://x' }, vault([], 500))).toEqual([]);
  });

  it('explains RPC failures', async () => {
    await expect(loadVaultSecrets({ ...base }, vault({}, 404))).rejects.toThrow(/app_secrets\.sql/);
  });
});
