import type { DayWeather } from '@tc/types';
import { readJson, type FetchFn } from './http.js';

/** https://open-meteo.com/en/docs (free, no key). Forecast covers today + 15 days. */
export const FORECAST_DAYS = 16;

const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Severe thunderstorm',
};

export function describeWeather(code: number | null | undefined): string | null {
  return code == null ? null : (WMO[code] ?? null);
}

export class OpenMeteoClient {
  constructor(private fetchFn: FetchFn = fetch) {}

  async daily(lat: number, lng: number, startDate: string, endDate: string): Promise<DayWeather[]> {
    const q = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Kolkata',
      start_date: startDate,
      end_date: endDate,
    });
    const res = await this.fetchFn(`https://api.open-meteo.com/v1/forecast?${q}`);
    const json = await readJson<{
      daily?: {
        time: string[];
        weather_code?: (number | null)[];
        temperature_2m_max?: (number | null)[];
        temperature_2m_min?: (number | null)[];
        precipitation_probability_max?: (number | null)[];
      };
    }>(res, 'Open-Meteo');
    const d = json.daily;
    if (!d) return [];
    return d.time.map((date, i) => ({
      date,
      tempMaxC: d.temperature_2m_max?.[i] ?? null,
      tempMinC: d.temperature_2m_min?.[i] ?? null,
      precipitationProbability: d.precipitation_probability_max?.[i] ?? null,
      weatherCode: d.weather_code?.[i] ?? null,
      summary: describeWeather(d.weather_code?.[i]),
    }));
  }
}
