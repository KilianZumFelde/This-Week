import { describe, it, expect } from 'vitest';
import { validateMilestoneDate } from '../lib/milestones.js';

const TODAY = '2026-06-17';
const GOAL_DATE = '2026-12-31';

describe('validateMilestoneDate', () => {
  it('rejects a date in the past', () => {
    const result = validateMilestoneDate('2026-06-10', GOAL_DATE, TODAY);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/future/i);
  });

  it('rejects today (not strictly future)', () => {
    const result = validateMilestoneDate(TODAY, GOAL_DATE, TODAY);
    expect(result.ok).toBe(false);
  });

  it('rejects a date after the goal target_date', () => {
    const result = validateMilestoneDate('2027-01-01', GOAL_DATE, TODAY);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/goal/i);
  });

  it('accepts a date equal to the goal target_date', () => {
    const result = validateMilestoneDate(GOAL_DATE, GOAL_DATE, TODAY);
    expect(result.ok).toBe(true);
  });

  it('accepts a valid future date before the goal', () => {
    const result = validateMilestoneDate('2026-09-01', GOAL_DATE, TODAY);
    expect(result.ok).toBe(true);
  });
});
