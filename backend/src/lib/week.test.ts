import { getCurrentWeekStartDate } from './week.js';

const RealDate = globalThis.Date;

function withMockedDate(isoString: string, fn: () => void) {
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
  try { fn(); } finally { globalThis.Date = RealDate; }
}

// Wednesday 2024-01-10 12:00 UTC = 13:00 Europe/Berlin = Wednesday in Berlin
// → previous Sunday must be 2024-01-07
withMockedDate('2024-01-10T12:00:00.000Z', () => {
  const result = getCurrentWeekStartDate('Europe/Berlin');
  if (result !== '2024-01-07') throw new Error(`Expected 2024-01-07 but got ${result}`);
  console.log('✓ Wednesday in Europe/Berlin → Sunday 2024-01-07');
});

// Sunday 2024-01-07 12:00 UTC = 13:00 Europe/Berlin = Sunday in Berlin
// → same day is the week start
withMockedDate('2024-01-07T12:00:00.000Z', () => {
  const result = getCurrentWeekStartDate('Europe/Berlin');
  if (result !== '2024-01-07') throw new Error(`Expected 2024-01-07 but got ${result}`);
  console.log('✓ Sunday in Europe/Berlin → same day 2024-01-07');
});
