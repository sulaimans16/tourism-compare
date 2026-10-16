import { defineConfig } from '@playwright/test';

/**
 * E2E_LIVE=1 runs against a real node-api (VITE_API_BASE_URL) with live SerpApi/Google data.
 * Without it, API responses are stubbed in the spec so the UI flow can run in CI without keys.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    env: {
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://api.e2e.local',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://e2e.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'e2e-anon',
    },
  },
});
