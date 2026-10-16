/** Secrets that may come from Supabase Vault (see supabase/migrations/*_app_secrets.sql). */
export const VAULT_KEYS = ['SERPAPI_API_KEY', 'GOOGLE_MAPS_API_KEY', 'PRICING_SERVICE_TOKEN', 'REDIRECT_SIGNING_SECRET'] as const;

/**
 * Fills missing env vars from Vault via the service-role-only `get_app_secrets` RPC.
 * Values already set in the environment always win. Returns the names loaded from Vault.
 */
export async function loadVaultSecrets(
  env: NodeJS.ProcessEnv = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  const missing = VAULT_KEYS.filter((k) => !env[k]);
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (missing.length === 0 || !url || !key) return [];

  const res = await fetchFn(`${url.replace(/\/+$/, '')}/rest/v1/rpc/get_app_secrets`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error(
      `Could not load secrets from Supabase Vault (HTTP ${res.status}). ` +
        'Apply supabase/migrations/*_app_secrets.sql and check SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  const rows = (await res.json()) as { name: string; value: string }[];
  const loaded: string[] = [];
  for (const { name, value } of rows) {
    if ((missing as readonly string[]).includes(name) && value) {
      env[name] = value;
      loaded.push(name);
    }
  }
  return loaded;
}
