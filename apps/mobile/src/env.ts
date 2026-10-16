function req(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing ${name}. Set it in apps/mobile/.env (see the root .env.example).`);
  return v;
}

export const env = {
  apiBaseUrl: req('EXPO_PUBLIC_API_BASE_URL', process.env.EXPO_PUBLIC_API_BASE_URL),
  supabaseUrl: req('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: req('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
};
