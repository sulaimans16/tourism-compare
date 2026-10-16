import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function errorMessage(e: unknown): string {
  if (!e) return '';
  const err = e as { code?: string; message?: string };
  if (err.code === 'PROVIDER_QUOTA_EXCEEDED') return 'Live price lookups are temporarily exhausted. Please try again later.';
  if (err.code === 'PRICING_UNAVAILABLE' || err.code === 'PROVIDER_UNAVAILABLE')
    return 'Price comparison is temporarily unavailable. Please retry shortly.';
  return err.message ?? 'Something went wrong';
}
