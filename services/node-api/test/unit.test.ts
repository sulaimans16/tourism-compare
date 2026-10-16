import { describe, expect, it } from 'vitest';
import { planDays, datesBetween } from '../src/repos/trips.js';
import { agencyScore } from '../src/services/agencies.js';
import { whatsappUrl } from '../src/clients/googlePlaces.js';
import { loadConfig } from '../src/config.js';

describe('planDays', () => {
  it('fills days in order and repeats the last destination', () => {
    expect(planDays('2026-12-01', '2026-12-04', ['madurai', 'rameswaram'])).toEqual([
      { day_date: '2026-12-01', destination_id: 'madurai' },
      { day_date: '2026-12-02', destination_id: 'rameswaram' },
      { day_date: '2026-12-03', destination_id: 'rameswaram' },
      { day_date: '2026-12-04', destination_id: 'rameswaram' },
    ]);
  });
  it('handles month boundaries', () => {
    expect(datesBetween('2026-12-30', '2027-01-02')).toHaveLength(4);
  });
});

describe('agencyScore', () => {
  it('prefers many good reviews over a handful of perfect ones', () => {
    expect(agencyScore({ rating: 4.6, userRatingCount: 900 })).toBeGreaterThan(agencyScore({ rating: 5, userRatingCount: 3 }));
  });
});

describe('whatsappUrl', () => {
  it('only links Indian mobile numbers', () => {
    expect(whatsappUrl('+91 98430 12345')).toBe('https://wa.me/919843012345');
    expect(whatsappUrl('+91 423 244 3977')).toBeNull();
    expect(whatsappUrl(null)).toBeNull();
  });
});

describe('config', () => {
  it('fails loudly when keys are missing', () => {
    expect(() => loadConfig({})).toThrow(/GOOGLE_MAPS_API_KEY|SUPABASE_URL/);
  });
});

describe('config for Vercel', () => {
  const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'a', GOOGLE_MAPS_API_KEY: 'g', PRICING_SERVICE_TOKEN: 'x'.repeat(16) };
  it('derives the public URL from the Vercel production domain and base path', () => {
    const c = loadConfig({ ...base, API_BASE_PATH: '/api', VERCEL_PROJECT_PRODUCTION_URL: 'yatra.vercel.app' });
    expect(c.PUBLIC_API_URL).toBe('https://yatra.vercel.app/api');
  });
  it('prefers an explicit PUBLIC_API_URL', () => {
    expect(loadConfig({ ...base, PUBLIC_API_URL: 'https://api.example.com/' }).PUBLIC_API_URL).toBe('https://api.example.com');
  });
});
