import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { getCurrentWeekStartDate } from './week.js';

const RealDate = globalThis.Date;

function mockDate(isoString: string) {
  const fixed = new RealDate(isoString).getTime();
  const MockDate = function (...args: unknown[]) {
    if (args.length === 0) return new RealDate(fixed);
    return new (RealDate as unknown as new (...a: unknown[]) => Date)(...args);
  } as unknown as typeof Date;
  MockDate.now = () => fixed;
  MockDate.parse = RealDate.parse;
  MockDate.UTC = RealDate.UTC;
  Object.setPrototypeOf(MockDate, RealDate);
  Object.defineProperty(MockDate, 'prototype', { value: RealDate.prototype });
  globalThis.Date = MockDate;
}

afterEach(() => { globalThis.Date = RealDate; });

describe('getCurrentWeekStartDate', () => {
  it('returns 2024-01-07 for Wednesday 2024-01-10 in Europe/Berlin', () => {
    mockDate('2024-01-10T12:00:00.000Z'); // 13:00 Berlin = Wednesday
    expect(getCurrentWeekStartDate('Europe/Berlin')).toBe('2024-01-07');
  });

  it('returns same day for Sunday 2024-01-07 in Europe/Berlin', () => {
    mockDate('2024-01-07T12:00:00.000Z'); // 13:00 Berlin = Sunday
    expect(getCurrentWeekStartDate('Europe/Berlin')).toBe('2024-01-07');
  });

  it('returns a date string in YYYY-MM-DD format', () => {
    const result = getCurrentWeekStartDate('UTC');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('always returns a Sunday for multiple timezones', () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Tokyo', 'Europe/Berlin'];
    for (const tz of timezones) {
      const result = getCurrentWeekStartDate(tz);
      const d = new RealDate(result + 'T00:00:00');
      expect(d.getDay(), `${tz} should return Sunday`).toBe(0);
    }
  });
});
