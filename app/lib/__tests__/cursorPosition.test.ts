import { cursorPosition } from '../cursorPosition';

describe('cursorPosition', () => {
  it('returns 0 when committed is 0', () => {
    expect(cursorPosition({ committed: 0, completed: 0, dayIndexInWeek: 3 })).toBe(0);
  });

  it('returns 0 when nothing completed (behind on day 1)', () => {
    expect(cursorPosition({ committed: 5, completed: 0, dayIndexInWeek: 1 })).toBe(0);
  });

  it('returns completion fraction (behind pace on day 3)', () => {
    // expected = 5 * 3/7 ≈ 2.14; completed 1 → behind
    expect(cursorPosition({ committed: 5, completed: 1, dayIndexInWeek: 3 })).toBeCloseTo(0.2);
  });

  it('returns completion fraction (on pace on day 3)', () => {
    // expected = 5 * 3/7 ≈ 2.14; completed 2 → roughly on pace
    expect(cursorPosition({ committed: 5, completed: 2, dayIndexInWeek: 3 })).toBeCloseTo(0.4);
  });

  it('returns completion fraction (ahead on day 1)', () => {
    // expected = 5 * 1/7 ≈ 0.71; completed 3 → ahead
    expect(cursorPosition({ committed: 5, completed: 3, dayIndexInWeek: 1 })).toBeCloseTo(0.6);
  });

  it('returns 1 when all completed (day 7)', () => {
    expect(cursorPosition({ committed: 5, completed: 5, dayIndexInWeek: 6 })).toBe(1);
  });

  it('clamps at 1 if completed exceeds committed', () => {
    expect(cursorPosition({ committed: 3, completed: 4, dayIndexInWeek: 5 })).toBe(1);
  });
});
