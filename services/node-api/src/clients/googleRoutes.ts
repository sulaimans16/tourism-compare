import { readJson, type FetchFn } from './http.js';

/** Google Routes API: https://developers.google.com/maps/documentation/routes/compute_route_directions */
export class GoogleRoutesClient {
  constructor(
    private apiKey: string,
    private fetchFn: FetchFn = fetch,
  ) {}

  async drive(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): Promise<{ distanceMeters: number | null; durationSeconds: number | null }> {
    const res = await this.fetchFn('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
        destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
        travelMode: 'DRIVE',
        regionCode: 'IN',
        units: 'METRIC',
      }),
    });
    const json = await readJson<{ routes?: { duration?: string; distanceMeters?: number }[] }>(res, 'Google Routes');
    const r = json.routes?.[0];
    return {
      distanceMeters: r?.distanceMeters ?? null,
      durationSeconds: r?.duration ? Number.parseInt(r.duration, 10) : null,
    };
  }
}
