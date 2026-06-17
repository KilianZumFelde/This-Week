import { describe, it, expect } from 'vitest';
import { computeHealthLevel } from '../lib/goalHealth.js';

describe('computeHealthLevel', () => {
  // Full 4×3 mapping table from requirements-lens.md
  it('a_lot + yes → well_ahead',      () => expect(computeHealthLevel('a_lot', 'yes')).toBe('well_ahead'));
  it('a_lot + maybe → ahead',         () => expect(computeHealthLevel('a_lot', 'maybe')).toBe('ahead'));
  it('a_lot + no → on_track',         () => expect(computeHealthLevel('a_lot', 'no')).toBe('on_track'));

  it('some + yes → ahead',            () => expect(computeHealthLevel('some', 'yes')).toBe('ahead'));
  it('some + maybe → on_track',       () => expect(computeHealthLevel('some', 'maybe')).toBe('on_track'));
  it('some + no → slightly_behind',   () => expect(computeHealthLevel('some', 'no')).toBe('slightly_behind'));

  it('barely + yes → on_track',       () => expect(computeHealthLevel('barely', 'yes')).toBe('on_track'));
  it('barely + maybe → slightly_behind', () => expect(computeHealthLevel('barely', 'maybe')).toBe('slightly_behind'));
  it('barely + no → behind',          () => expect(computeHealthLevel('barely', 'no')).toBe('behind'));

  it('nothing + yes → slightly_behind', () => expect(computeHealthLevel('nothing', 'yes')).toBe('slightly_behind'));
  it('nothing + maybe → behind',      () => expect(computeHealthLevel('nothing', 'maybe')).toBe('behind'));
  it('nothing + no → behind',         () => expect(computeHealthLevel('nothing', 'no')).toBe('behind'));
});
