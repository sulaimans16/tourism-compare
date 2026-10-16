const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatInr = (n: number | null | undefined) => (n == null ? '-' : inr.format(n));

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '-';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return '-';
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}

/** "fetched 3 min ago" style label for live data. */
export function freshness(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

/** Days in a trip from a day-index offset. Useful for check-in/out defaults per destination. */
export function stayWindow(days: { dayDate: string; destinationId: string }[], destinationId: string) {
  const mine = days.filter((d) => d.destinationId === destinationId).map((d) => d.dayDate).sort();
  if (!mine.length) return null;
  return { checkIn: mine[0]!, checkOut: addDays(mine[mine.length - 1]!, 1) };
}
