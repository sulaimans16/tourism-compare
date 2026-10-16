import type { Destination, DayWeather, Leg, TripDetail, TripEnrichment } from '@tc/types';
import type { Deps } from '../deps.js';
import { cached } from '../lib/cache.js';
import { FORECAST_DAYS } from '../clients/openMeteo.js';

const todayIst = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Weather per day (when inside the forecast window) and drive time between consecutive stops. */
export async function enrichTrip(deps: Deps, trip: TripDetail, dests: Map<string, Destination>): Promise<TripEnrichment> {
  const today = todayIst();
  const horizon = addDays(today, FORECAST_DAYS - 1);

  // One forecast call per destination covering the days spent there.
  const forecasts = new Map<string, Map<string, DayWeather>>();
  const byDest = new Map<string, string[]>();
  for (const day of trip.days) {
    if (day.dayDate < today || day.dayDate > horizon) continue;
    byDest.set(day.destinationId, [...(byDest.get(day.destinationId) ?? []), day.dayDate]);
  }
  await Promise.all(
    [...byDest.entries()].map(async ([destId, dates]) => {
      const d = dests.get(destId);
      if (!d) return;
      const sorted = dates.sort();
      const start = sorted[0]!;
      const end = sorted[sorted.length - 1]!;
      try {
        const days = await cached(deps.cache, `wx:${destId}:${start}:${end}`, 3 * 3600, () =>
          deps.weather.daily(d.lat, d.lng, start, end),
        );
        forecasts.set(destId, new Map(days.map((w) => [w.date, w])));
      } catch {
        // weather is a nice-to-have; leave it null rather than failing the itinerary
      }
    }),
  );

  const days = await Promise.all(
    trip.days.map(async (day) => {
      const stops = day.items.filter((i) => i.lat != null && i.lng != null);
      const legs: Leg[] = await Promise.all(
        stops.slice(1).map(async (to, idx) => {
          const from = stops[idx]!;
          const key = `route:${from.lat},${from.lng}:${to.lat},${to.lng}`;
          try {
            const r = await cached(deps.cache, key, 24 * 3600, () =>
              deps.routes.drive({ lat: from.lat!, lng: from.lng! }, { lat: to.lat!, lng: to.lng! }),
            );
            return { fromItemId: from.id, toItemId: to.id, ...r };
          } catch {
            return { fromItemId: from.id, toItemId: to.id, distanceMeters: null, durationSeconds: null };
          }
        }),
      );
      return {
        tripDayId: day.id,
        date: day.dayDate,
        weather: forecasts.get(day.destinationId)?.get(day.dayDate) ?? null,
        legs,
      };
    }),
  );
  return { days };
}
