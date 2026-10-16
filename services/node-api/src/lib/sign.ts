import { createHmac, timingSafeEqual } from 'node:crypto';

export interface RedirectTarget {
  url: string;
  kind: 'stay' | 'agency';
  platform?: string;
  tripId?: string;
}

function canonical(t: RedirectTarget) {
  return [t.kind, t.url, t.platform ?? '', t.tripId ?? ''].join('\n');
}

export function sign(t: RedirectTarget, secret: string): string {
  return createHmac('sha256', secret).update(canonical(t)).digest('base64url');
}

export function verify(t: RedirectTarget, sig: string, secret: string): boolean {
  const expected = Buffer.from(sign(t, secret));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Builds a tracked, tamper-proof redirect link: we only ever redirect to URLs we signed. */
export function redirectUrl(base: string, t: RedirectTarget, secret: string): string {
  const q = new URLSearchParams({ u: t.url, k: t.kind, s: sign(t, secret) });
  if (t.platform) q.set('p', t.platform);
  if (t.tripId) q.set('t', t.tripId);
  return `${base.replace(/\/+$/, '')}/go?${q.toString()}`;
}
