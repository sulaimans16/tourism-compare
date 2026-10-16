import type { Agency, Place } from '@tc/types';
import { HttpError } from '../lib/errors.js';
import { readJson, type FetchFn } from './http.js';

/** Google Places API (New): https://developers.google.com/maps/documentation/places/web-service/text-search */
const BASE = 'https://places.googleapis.com/v1';

const PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'primaryType',
  'googleMapsUri',
  'photos',
  'editorialSummary',
];
const AGENCY_FIELDS = [
  ...PLACE_FIELDS,
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'currentOpeningHours',
  'regularOpeningHours',
  'businessStatus',
];

interface GPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
  editorialSummary?: { text?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  businessStatus?: string;
}

export interface TextSearchInput {
  query: string;
  includedType?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  pageSize?: number;
  pageToken?: string;
}

export class GooglePlacesClient {
  constructor(
    private apiKey: string,
    /** Builds a URL to our photo proxy for a Places photo resource name. */
    private photoUrl: (photoName: string) => string,
    private fetchFn: FetchFn = fetch,
  ) {}

  private async searchText(input: TextSearchInput, fields: string[]) {
    const body: Record<string, unknown> = {
      textQuery: input.query,
      languageCode: 'en',
      regionCode: 'IN',
      pageSize: input.pageSize ?? 20,
    };
    if (input.includedType) body.includedType = input.includedType;
    if (input.pageToken) body.pageToken = input.pageToken;
    if (input.lat != null && input.lng != null) {
      body.locationBias = {
        circle: { center: { latitude: input.lat, longitude: input.lng }, radius: input.radiusMeters ?? 25_000 },
      };
    }
    const res = await this.fetchFn(`${BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': [...fields.map((f) => `places.${f}`), 'nextPageToken'].join(','),
      },
      body: JSON.stringify(body),
    });
    return readJson<{ places?: GPlace[]; nextPageToken?: string }>(res, 'Google Places');
  }

  async searchPlaces(input: TextSearchInput): Promise<{ places: Place[]; nextPageToken: string | null }> {
    const json = await this.searchText(input, PLACE_FIELDS);
    return { places: (json.places ?? []).map((p) => this.toPlace(p)), nextPageToken: json.nextPageToken ?? null };
  }

  async searchAgencies(input: TextSearchInput): Promise<Agency[]> {
    const json = await this.searchText(input, AGENCY_FIELDS);
    return (json.places ?? []).map((p) => toAgency(p));
  }

  /** Resolves a Places photo resource name to a short-lived googleusercontent URL (no API key in it). */
  async photoUri(photoName: string, maxWidthPx = 800): Promise<string> {
    if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(photoName)) {
      throw new HttpError(400, 'BAD_REQUEST', 'Invalid photo name');
    }
    const url = `${BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`;
    const res = await this.fetchFn(url, { headers: { 'X-Goog-Api-Key': this.apiKey } });
    const json = await readJson<{ photoUri?: string }>(res, 'Google Places Photos');
    if (!json.photoUri) throw new HttpError(404, 'NOT_FOUND', 'Photo not found');
    return json.photoUri;
  }

  toPlace(p: GPlace): Place {
    const photo = p.photos?.[0]?.name;
    return {
      placeId: p.id,
      name: p.displayName?.text ?? 'Unnamed place',
      address: p.formattedAddress ?? null,
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      primaryType: p.primaryType ?? null,
      googleMapsUri: p.googleMapsUri ?? null,
      photoUrl: photo ? this.photoUrl(photo) : null,
      editorialSummary: p.editorialSummary?.text ?? null,
    };
  }
}

/** Indian mobile numbers (+91 6-9xxxxxxxxx) can be opened in WhatsApp; landlines cannot. */
export function whatsappUrl(international?: string | null): string | null {
  if (!international) return null;
  const digits = international.replace(/\D/g, '');
  return /^91[6-9]\d{9}$/.test(digits) ? `https://wa.me/${digits}` : null;
}

export function toAgency(p: GPlace): Agency {
  const hours = p.currentOpeningHours ?? p.regularOpeningHours;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? 'Unnamed agency',
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    userRatingCount: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? null,
    internationalPhone: p.internationalPhoneNumber ?? null,
    whatsappUrl: whatsappUrl(p.internationalPhoneNumber),
    website: p.websiteUri ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
    openNow: p.currentOpeningHours?.openNow ?? null,
    weekdayHours: hours?.weekdayDescriptions ?? [],
    businessStatus: p.businessStatus ?? null,
    source: 'google',
  };
}
