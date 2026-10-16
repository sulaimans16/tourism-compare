function req(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing ${name}. Copy .env.example to .env at the repo root and fill it in.`);
  return v;
}

export const env = {
  apiBaseUrl: req('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: req('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: req('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  /** Browser key for the Maps JavaScript API (HTTP-referrer restricted). Optional: maps hide without it. */
  googleMapsBrowserKey: (import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string | undefined) || null,
  googleMapId: (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || 'DEMO_MAP_ID',
};
