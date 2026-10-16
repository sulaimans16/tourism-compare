import { HttpError } from '../lib/errors.js';

export type FetchFn = typeof fetch;

export async function readJson<T>(res: Response, upstream: string): Promise<T> {
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(502, 'UPSTREAM_ERROR', `${upstream} returned invalid JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    const msg =
      (body as { error?: { message?: string } })?.error?.message ?? `${upstream} HTTP ${res.status}`;
    const code = (body as { error?: { code?: unknown } })?.error?.code;
    if (res.status === 429) throw new HttpError(429, typeof code === 'string' ? code : 'UPSTREAM_RATE_LIMITED', msg);
    if (res.status === 404) throw new HttpError(404, typeof code === 'string' ? code : 'NOT_FOUND', msg);
    if (res.status === 400) throw new HttpError(400, typeof code === 'string' ? code : 'BAD_REQUEST', msg);
    throw new HttpError(502, typeof code === 'string' ? code : 'UPSTREAM_ERROR', msg);
  }
  return body as T;
}
