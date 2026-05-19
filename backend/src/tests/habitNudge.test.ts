import { describe, it, expect } from 'vitest';
import { isDangerZone, daysLeftInWeek } from '../lib/habitNudge.js';

describe('isDangerZone', () => {
  it('returns false when already on target', () => {
    expect(isDangerZone({ weeklyTarget: 4, completedCount: 4, daysLeft: 3 })).toBe(false);
  });

  it('returns false when plenty of time remains', () => {
    // Need 3 more, 6 days left → not danger zone (3 + 1 = 4 < 6)
    expect(isDangerZone({ weeklyTarget: 4, completedCount: 1, daysLeft: 6 })).toBe(false);
  });

  it('returns true when at the margin (count_remaining + 1 === days_left)', () => {
    // Need 2 more, 3 days left → 2 + 1 = 3 >= 3 → danger zone
    expect(isDangerZone({ weeklyTarget: 4, completedCount: 2, daysLeft: 3 })).toBe(true);
  });

  it('returns true when past the margin (not enough days)', () => {
    // Need 3 more, 2 days left → 3 + 1 = 4 >= 2 → danger zone
    expect(isDangerZone({ weeklyTarget: 4, completedCount: 1, daysLeft: 2 })).toBe(true);
  });

  it('returns false when completed equals target', () => {
    expect(isDangerZone({ weeklyTarget: 3, completedCount: 3, daysLeft: 1 })).toBe(false);
  });

  it('returns false when completed exceeds target', () => {
    expect(isDangerZone({ weeklyTarget: 3, completedCount: 5, daysLeft: 1 })).toBe(false);
  });

  it('handles 7× / week habit correctly near end of week', () => {
    // Need 1 more, 1 day left → 1 + 1 = 2 >= 1 → danger zone
    expect(isDangerZone({ weeklyTarget: 7, completedCount: 6, daysLeft: 1 })).toBe(true);
    // Need 1 more, 2 days left → 1 + 1 = 2 >= 2 → danger zone
    expect(isDangerZone({ weeklyTarget: 7, completedCount: 6, daysLeft: 2 })).toBe(true);
    // Need 1 more, 3 days left → 1 + 1 = 2 < 3 → safe
    expect(isDangerZone({ weeklyTarget: 7, completedCount: 6, daysLeft: 3 })).toBe(false);
  });
});

describe('daysLeftInWeek', () => {
  it('returns 7 on Sunday (day 0)', () => {
    expect(daysLeftInWeek(0)).toBe(7);
  });

  it('returns 1 on Saturday (day 6)', () => {
    expect(daysLeftInWeek(6)).toBe(1);
  });

  it('returns 4 on Thursday (day 4)', () => {
    expect(daysLeftInWeek(4)).toBe(3);
  });
});
