import { describe, expect, it } from 'vitest';
import { formatDuration, formatInr, nightsBetween, stayWindow, freshness } from './format.js';

describe('format', () => {
  it('formats INR in Indian grouping', () => {
    expect(formatInr(125000)).toBe('₹1,25,000');
    expect(formatInr(null)).toBe('-');
  });
  it('formats durations', () => {
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(150 * 60)).toBe('2 h 30 min');
  });
  it('computes nights and stay windows', () => {
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
    const days = [
      { dayDate: '2026-12-01', destinationId: 'madurai' },
      { dayDate: '2026-12-02', destinationId: 'ooty' },
      { dayDate: '2026-12-03', destinationId: 'ooty' },
    ];
    expect(stayWindow(days, 'ooty')).toEqual({ checkIn: '2026-12-02', checkOut: '2026-12-04' });
  });
  it('labels freshness', () => {
    expect(freshness(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 min ago');
  });
});
