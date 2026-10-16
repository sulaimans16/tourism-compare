/**
 * Settings come from window.__ENV__ (written to /env.js by the container at startup, so one image
 * works for every environment) and fall back to Vite build-time variables for local dev.
 */
type RuntimeEnv = Partial<Record<'API_BASE_URL' | 'SUPABASE_URL' | 'SUPABASE_ANON_KEY' | 'GOOGLE_MAPS_BROWSER_KEY' | 'GOOGLE_MAP_ID', string>>;
const runtime: RuntimeEnv = (globalThis as { __ENV__?: RuntimeEnv }).__ENV__ ?? {};

function pick(key: keyof RuntimeEnv, viteValue: string | undefined): string | null {
  return runtime[key] || viteValue || null;
}

function req(name: string, v: string | null): string {
  if (!v) throw new Error(`Missing ${name}. Set it in /env.js (deployed) or in .env at the repo root (local dev).`);
  return v;
}

export const env = {
  apiBaseUrl: req('API_BASE_URL', pick('API_BASE_URL', import.meta.env.VITE_API_BASE_URL)),
  supabaseUrl: req('SUPABASE_URL', pick('SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)),
  supabaseAnonKey: req('SUPABASE_ANON_KEY', pick('SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)),
  /** Browser key for the Maps JavaScript API (HTTP-referrer restricted). Optional: maps hide without it. */
  googleMapsBrowserKey: pick('GOOGLE_MAPS_BROWSER_KEY', import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY),
  googleMapId: pick('GOOGLE_MAP_ID', import.meta.env.VITE_GOOGLE_MAP_ID) ?? 'DEMO_MAP_ID',
};
