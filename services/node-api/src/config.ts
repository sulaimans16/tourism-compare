import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default('0.0.0.0'),
  /** Path prefix the API is mounted under (Vercel routes /api/* here with the prefix intact). */
  API_BASE_PATH: z
    .string()
    .regex(/^(\/[a-z0-9-]+)*$/i, 'API_BASE_PATH must look like /api or be empty')
    .default(''),
  /** Public base URL of this API, used to build tracked redirect and photo links. */
  PUBLIC_API_URL: z.string().url().optional(),
  /** Set by Vercel: the project's production domain, used when PUBLIC_API_URL is not set. */
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be set' }),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY must be set'),
  /** Optional: enables outbound click logging. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().min(1, 'GOOGLE_MAPS_API_KEY must be set'),
  PRICING_SERVICE_URL: z.string().url().default('http://localhost:8090'),
  PRICING_SERVICE_TOKEN: z.string().min(16, 'PRICING_SERVICE_TOKEN must be at least 16 chars'),
  /** HMAC secret for /go redirect links. Defaults to PRICING_SERVICE_TOKEN. */
  REDIRECT_SIGNING_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CACHE_BACKEND: z.enum(['memory', 'redis']).default('memory'),
});

export type Config = Omit<z.infer<typeof Env>, 'PUBLIC_API_URL'> & {
  PUBLIC_API_URL: string;
  redirectSecret: string;
  corsOrigins: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration (see .env.example):\n${problems}`);
  }
  const c = parsed.data;
  const publicUrl =
    c.PUBLIC_API_URL ??
    (c.VERCEL_PROJECT_PRODUCTION_URL ? `https://${c.VERCEL_PROJECT_PRODUCTION_URL}${c.API_BASE_PATH}` : `http://localhost:${c.PORT}`);
  return {
    ...c,
    PUBLIC_API_URL: publicUrl.replace(/\/+$/, ''),
    redirectSecret: c.REDIRECT_SIGNING_SECRET ?? c.PRICING_SERVICE_TOKEN,
    corsOrigins: c.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  };
}
