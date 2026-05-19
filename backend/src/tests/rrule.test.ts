import { describe, it, expect } from 'vitest';
import { nextOccurrenceFromRRule } from '../lib/rrule.js';

// 2026-05-18 is a Monday (getDay() === 1)
const MONDAY = new Date('2026-05-18T10:00:00Z');

describe('nextOccurrenceFromRRule', () => {
  it('FREQ=DAILY returns exactly 24h later', () => {
    const result = nextOccurrenceFromRRule('FREQ=DAILY', MONDAY);
    expect(result.getTime()).toBe(MONDAY.getTime() + 24 * 60 * 60 * 1000);
  });

  it('FREQ=WEEKLY;BYDAY=MO — fired on Monday, next is following Monday', () => {
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY;BYDAY=MO', MONDAY);
    expect(result.getUTCDay()).toBe(1); // Monday
    expect(result.getTime()).toBeGreaterThan(MONDAY.getTime());
    // Should be exactly 7 days later
    expect(result.getTime()).toBe(MONDAY.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  it('FREQ=WEEKLY;BYDAY=WE — fired on Monday, next is Wednesday (2 days later)', () => {
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY;BYDAY=WE', MONDAY);
    expect(result.getUTCDay()).toBe(3); // Wednesday
    expect(result.getTime()).toBe(MONDAY.getTime() + 2 * 24 * 60 * 60 * 1000);
  });

  it('FREQ=WEEKLY;BYDAY=MO,WE,FR — fired on Monday, next is Wednesday', () => {
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY;BYDAY=MO,WE,FR', MONDAY);
    expect(result.getUTCDay()).toBe(3); // Wednesday
  });

  it('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR (weekdays) — fired on Friday, next is Monday', () => {
    const FRIDAY = new Date('2026-05-22T10:00:00Z'); // Friday
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', FRIDAY);
    expect(result.getUTCDay()).toBe(1); // Monday
  });

  it('FREQ=WEEKLY;BYDAY=SA,SU (weekends) — fired on Monday, next is Saturday', () => {
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY;BYDAY=SA,SU', MONDAY);
    expect(result.getUTCDay()).toBe(6); // Saturday
  });

  it('unknown rule falls back to +24h', () => {
    const result = nextOccurrenceFromRRule('FREQ=MONTHLY', MONDAY);
    expect(result.getTime()).toBe(MONDAY.getTime() + 24 * 60 * 60 * 1000);
  });

  it('WEEKLY with no BYDAY falls back to +24h', () => {
    const result = nextOccurrenceFromRRule('FREQ=WEEKLY', MONDAY);
    expect(result.getTime()).toBe(MONDAY.getTime() + 24 * 60 * 60 * 1000);
  });
});
