import { describe, it, expect } from 'vitest';
import { getPreviousWeekStartDate } from '../lib/dateUtils.js';

describe('getPreviousWeekStartDate', () => {
  it('returns exactly 7 days before the given date', () => {
    expect(getPreviousWeekStartDate('2025-05-18')).toBe('2025-05-11');
  });

  it('handles month boundaries', () => {
    expect(getPreviousWeekStartDate('2025-05-04')).toBe('2025-04-27');
  });

  it('handles year boundaries', () => {
    expect(getPreviousWeekStartDate('2025-01-05')).toBe('2024-12-29');
  });

  it('returns a Sunday given a Sunday input', () => {
    // 2025-05-18 is a Sunday
    const result = getPreviousWeekStartDate('2025-05-18');
    const d = new Date(result + 'T00:00:00');
    expect(d.getDay()).toBe(0);
  });

  it('handles leap year Feb boundary', () => {
    expect(getPreviousWeekStartDate('2024-03-03')).toBe('2024-02-25');
  });
});
