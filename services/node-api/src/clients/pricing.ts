import type { StayOffers, StaySearchQuery, StaySearchResult } from '@tc/types';
import { HttpError } from '../lib/errors.js';
import { readJson, type FetchFn } from './http.js';

/** Client for services/java-pricing (contract: packages/contracts/pricing.openapi.yaml). */
export class PricingClient {
  constructor(
    private baseUrl: string,
    private token: string,
    private fetchFn: FetchFn = fetch,
  ) {}

  private async get<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl.replace(/\/+$/, '')}${path}?${q}`, {
        headers: { 'X-Service-Token': this.token },
        signal: AbortSignal.timeout(45_000),
      });
    } catch (e) {
      throw new HttpError(502, 'PRICING_UNAVAILABLE', `Pricing service unreachable: ${(e as Error).message}`);
    }
    return readJson<T>(res, 'Pricing service');
  }

  search(q: StaySearchQuery & { destination: string }): Promise<StaySearchResult> {
    return this.get('/v1/stays/search', { ...q });
  }

  offers(
    propertyToken: string,
    q: { destination: string; checkIn: string; checkOut: string; adults: number; children: number; type: string },
  ): Promise<StayOffers> {
    return this.get(`/v1/stays/${encodeURIComponent(propertyToken)}/offers`, q);
  }
}
