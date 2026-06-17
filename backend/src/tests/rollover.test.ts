import { describe, it, expect } from 'vitest';
import { shouldCreateRitual } from '../lib/rolloverUtils.js';

describe('shouldCreateRitual — 4.1 trigger logic', () => {
  it('creates ritual when there are open leftover tasks (no active goals)', () => {
    expect(shouldCreateRitual(3, false)).toBe(true);
  });

  it('creates ritual when there are active goals (no leftover tasks)', () => {
    expect(shouldCreateRitual(0, true)).toBe(true);
  });

  it('creates ritual when both leftover tasks AND active goals exist', () => {
    expect(shouldCreateRitual(2, true)).toBe(true);
  });

  it('does NOT create ritual when no leftovers and no active goals', () => {
    expect(shouldCreateRitual(0, false)).toBe(false);
  });
});
