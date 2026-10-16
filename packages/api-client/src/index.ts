import type {
  CreateSavedStay,
  CreateTrip,
  CreateTripItem,
  Destination,
  DestinationAgencies,
  Place,
  SavedStay,
  StayOffers,
  StaySearchQuery,
  StaySearchResult,
  Trip,
  TripDay,
  TripDetail,
  TripEnrichment,
  TripItem,
  UpdateTrip,
  UpdateTripDay,
  UpdateTripItem,
} from '@tc/types';

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current Supabase access token, or null when signed out. */
  getToken?: () => Promise<string | null> | string | null;
  fetch?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function qs(q: Query): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Typed client for services/node-api. Platform-agnostic (browser, React Native, Node). */
export function createApiClient(opts: ApiClientOptions) {
  const base = opts.baseUrl.replace(/\/+$/, '');
  const f = opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = await opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await f(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      throw new ApiClientError(res.status, json?.error?.code ?? 'HTTP_ERROR', json?.error?.message ?? res.statusText);
    }
    return json as T;
  }

  const get = <T>(path: string, q: Query = {}) => request<T>('GET', `${path}${qs(q)}`);

  return {
    baseUrl: base,
    destinations: {
      list: () => get<{ destinations: Destination[] }>('/destinations').then((r) => r.destinations),
      get: (id: string) => get<Destination>(`/destinations/${encodeURIComponent(id)}`),
      photoUrl: (id: string) => `${base}/destinations/${encodeURIComponent(id)}/photo`,
      attractions: (id: string, q?: { q?: string; pageToken?: string }) =>
        get<{ places: Place[]; nextPageToken: string | null }>(`/destinations/${encodeURIComponent(id)}/attractions`, q),
      agencies: (id: string) => get<DestinationAgencies>(`/destinations/${encodeURIComponent(id)}/agencies`),
    },
    stays: {
      search: (q: Partial<StaySearchQuery> & Pick<StaySearchQuery, 'destination' | 'checkIn' | 'checkOut'>) =>
        get<StaySearchResult>('/stays/search', q),
      offers: (
        token: string,
        q: { destination: string; checkIn: string; checkOut: string; adults?: number; children?: number; type?: string; tripId?: string },
      ) => get<StayOffers>(`/stays/${encodeURIComponent(token)}/offers`, q),
    },
    trips: {
      list: () => get<{ trips: Trip[] }>('/trips').then((r) => r.trips),
      get: (id: string) => get<TripDetail>(`/trips/${id}`),
      create: (body: CreateTrip) => request<TripDetail>('POST', '/trips', body),
      update: (id: string, body: UpdateTrip) => request<Trip>('PATCH', `/trips/${id}`, body),
      remove: (id: string) => request<void>('DELETE', `/trips/${id}`),
      updateDay: (id: string, dayId: string, body: UpdateTripDay) =>
        request<TripDay>('PATCH', `/trips/${id}/days/${dayId}`, body),
      addItem: (id: string, dayId: string, body: CreateTripItem) =>
        request<TripItem>('POST', `/trips/${id}/days/${dayId}/items`, body),
      updateItem: (id: string, itemId: string, body: UpdateTripItem) =>
        request<TripItem>('PATCH', `/trips/${id}/items/${itemId}`, body),
      removeItem: (id: string, itemId: string) => request<void>('DELETE', `/trips/${id}/items/${itemId}`),
      reorder: (id: string, dayId: string, itemIds: string[]) =>
        request<TripDay>('PUT', `/trips/${id}/days/${dayId}/order`, { itemIds }),
      saveStay: (id: string, body: CreateSavedStay) => request<SavedStay>('POST', `/trips/${id}/stays`, body),
      removeStay: (id: string, stayId: string) => request<void>('DELETE', `/trips/${id}/stays/${stayId}`),
      enrich: (id: string) => get<TripEnrichment>(`/trips/${id}/enrich`),
      agencies: (id: string) => get<{ destinations: DestinationAgencies[] }>(`/trips/${id}/agencies`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
