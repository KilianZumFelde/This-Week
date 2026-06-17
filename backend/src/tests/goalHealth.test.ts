import { describe, it, expect } from 'vitest';
import {
  computeHealthLevel,
  calculateGoalHealth,
  getRecentContiguousRecords,
  getNegativeAdjustment,
  getPositiveAdjustment,
  type CurrentHealthInput,
  type HealthRecord,
} from '../lib/goalHealth.js';

// Test-data builders
function cur(week: string, p: string, c: string, goalId = 'g1'): CurrentHealthInput {
  return { goal_id: goalId, week_start_date: week, progress_answer: p as ProgressAnswer, confidence_answer: c as ConfidenceAnswer };
}
function rec(week: string, p: string, c: string, goalId = 'g1'): HealthRecord {
  return { goal_id: goalId, week_start_date: week, progress_answer: p as ProgressAnswer, confidence_answer: c as ConfidenceAnswer };
}

// Satisfy TS without importing the types again
type ProgressAnswer = 'a_lot' | 'some' | 'barely' | 'nothing';
type ConfidenceAnswer = 'yes' | 'maybe' | 'no';

// Reference Sundays (consecutive weeks)
const W0 = '2026-06-15'; // current
const W1 = '2026-06-08'; // -1
const W2 = '2026-06-01'; // -2
const W3 = '2026-05-25'; // -3

// ─────────────────────────────────────────────────────────────────────────────
// (1) 12 base pairs — new conservative table (via computeHealthLevel = base only)
// ─────────────────────────────────────────────────────────────────────────────
describe('(1) 12 base pairs — new conservative table', () => {
  it('a_lot  + yes   → ahead',           () => expect(computeHealthLevel('a_lot',   'yes')).toBe('ahead'));
  it('a_lot  + maybe → on_track',        () => expect(computeHealthLevel('a_lot',   'maybe')).toBe('on_track'));
  it('a_lot  + no    → slightly_behind', () => expect(computeHealthLevel('a_lot',   'no')).toBe('slightly_behind'));
  it('some   + yes   → on_track',        () => expect(computeHealthLevel('some',    'yes')).toBe('on_track'));
  it('some   + maybe → on_track',        () => expect(computeHealthLevel('some',    'maybe')).toBe('on_track'));
  it('some   + no    → slightly_behind', () => expect(computeHealthLevel('some',    'no')).toBe('slightly_behind'));
  it('barely + yes   → slightly_behind', () => expect(computeHealthLevel('barely',  'yes')).toBe('slightly_behind'));
  it('barely + maybe → slightly_behind', () => expect(computeHealthLevel('barely',  'maybe')).toBe('slightly_behind'));
  it('barely + no    → behind',          () => expect(computeHealthLevel('barely',  'no')).toBe('behind'));
  it('nothing + yes  → slightly_behind', () => expect(computeHealthLevel('nothing', 'yes')).toBe('slightly_behind'));
  it('nothing + maybe → slightly_behind',() => expect(computeHealthLevel('nothing', 'maybe')).toBe('slightly_behind'));
  it('nothing + no   → behind',          () => expect(computeHealthLevel('nothing', 'no')).toBe('behind'));
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) No-history behavior — empty historicalRecords returns base score
// ─────────────────────────────────────────────────────────────────────────────
describe('(2) no-history behavior', () => {
  it('returns base score when history is empty', () => {
    expect(calculateGoalHealth(cur(W0, 'some', 'yes'), [])).toBe('on_track');
    expect(calculateGoalHealth(cur(W0, 'a_lot', 'yes'), [])).toBe('ahead');
    expect(calculateGoalHealth(cur(W0, 'nothing', 'no'), [])).toBe('behind');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) 2× nothing+maybe → behind (stagnation pattern fires)
// ─────────────────────────────────────────────────────────────────────────────
it('(3) 2× nothing+maybe → behind', () => {
  // base(nothing+maybe)=1=slightly_behind; 2× stagnation → neg=-1 → 1-1=0=behind
  expect(calculateGoalHealth(cur(W0, 'nothing', 'maybe'), [rec(W1, 'nothing', 'maybe')])).toBe('behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (4) 3× stagnation → -2 adjustment
// ─────────────────────────────────────────────────────────────────────────────
it('(4) 3× stagnation → -2 adjustment', () => {
  // base(barely+maybe)=1; 3× stagnation → neg=-2; 3× not-yes → neg=-1 (p2 is stronger)
  // strongest: min(-2,-1,0)=-2; 1-2=-1 → clamped 0=behind
  expect(
    calculateGoalHealth(cur(W0, 'barely', 'maybe'), [rec(W1, 'barely', 'maybe'), rec(W2, 'barely', 'maybe')]),
  ).toBe('behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (5) 2× a_lot+no → behind (2× consecutive no-confidence)
// ─────────────────────────────────────────────────────────────────────────────
it('(5) 2× a_lot+no → behind', () => {
  // base(a_lot+no)=1=slightly_behind; 2× no → neg=-1 → 0=behind
  expect(calculateGoalHealth(cur(W0, 'a_lot', 'no'), [rec(W1, 'a_lot', 'no')])).toBe('behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (6) 3× no confidence → -2 adjustment
// ─────────────────────────────────────────────────────────────────────────────
it('(6) 3× consecutive no-confidence → -2', () => {
  // base(some+no)=1; 3× no → neg=-2; 1-2=-1 → clamped 0=behind
  expect(
    calculateGoalHealth(cur(W0, 'some', 'no'), [rec(W1, 'some', 'no'), rec(W2, 'some', 'no')]),
  ).toBe('behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (7) 2× a_lot+yes → well_ahead (positive +1)
// ─────────────────────────────────────────────────────────────────────────────
it('(7) 2× a_lot+yes → well_ahead', () => {
  // base(a_lot+yes)=3=ahead; no neg; 2× a_lot+yes → pos=+1 → 4=well_ahead
  expect(calculateGoalHealth(cur(W0, 'a_lot', 'yes'), [rec(W1, 'a_lot', 'yes')])).toBe('well_ahead');
});

// ─────────────────────────────────────────────────────────────────────────────
// (8) 3× (some|a_lot)+yes → ahead (positive +1)
// ─────────────────────────────────────────────────────────────────────────────
it('(8) 3× some+yes → ahead', () => {
  // base(some+yes)=2=on_track; no neg; 3× strong+yes → pos=+1 → 3=ahead
  expect(
    calculateGoalHealth(cur(W0, 'some', 'yes'), [rec(W1, 'some', 'yes'), rec(W2, 'some', 'yes')]),
  ).toBe('ahead');
});

// ─────────────────────────────────────────────────────────────────────────────
// (9) Positive not applied when negative fires
// ─────────────────────────────────────────────────────────────────────────────
it('(9) positive not applied when negative applies', () => {
  // 2× stagnation → neg=-1; confidence=maybe so positive can't fire (requires yes)
  // base(barely+maybe)=1; adj=neg=-1 → 0=behind (not slightly_behind as base alone would give)
  const history = [rec(W1, 'barely', 'maybe')];
  expect(calculateGoalHealth(cur(W0, 'barely', 'maybe'), history)).toBe('behind');
  // Confirm via helpers: neg fires, pos is 0 regardless
  const recs = getRecentContiguousRecords(cur(W0, 'barely', 'maybe'), history);
  expect(getNegativeAdjustment(recs)).toBe(-1);
  expect(getPositiveAdjustment(recs)).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// (10) Missing week breaks streak
// ─────────────────────────────────────────────────────────────────────────────
it('(10) non-contiguous history — gap stops the window', () => {
  // W0=2026-06-15, W2=2026-06-01 with W1=2026-06-08 missing → streak is [W0] only
  // base(nothing+maybe)=1=slightly_behind; no pattern fires on a single record
  expect(
    calculateGoalHealth(cur(W0, 'nothing', 'maybe'), [rec(W2, 'nothing', 'maybe')]),
  ).toBe('slightly_behind');
  // vs the contiguous 2-week case which gives behind (proved in case 3)
});

// ─────────────────────────────────────────────────────────────────────────────
// (11) Records from other goals ignored
// ─────────────────────────────────────────────────────────────────────────────
it('(11) records from other goals are ignored', () => {
  // other-goal has 3× nothing+maybe — stagnation would fire if these were counted
  const otherHistory = [
    rec(W1, 'nothing', 'maybe', 'other-goal'),
    rec(W2, 'nothing', 'maybe', 'other-goal'),
  ];
  // g1 has no prior history → base(nothing+maybe)=1=slightly_behind, no adj
  expect(calculateGoalHealth(cur(W0, 'nothing', 'maybe'), otherHistory)).toBe('slightly_behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (12) Stored record for the current week does not double-count — in-memory wins
// ─────────────────────────────────────────────────────────────────────────────
it('(12) in-memory current week overrides stored record for same week', () => {
  // stored says nothing+no for W0 (would give behind if used)
  const stored = rec(W0, 'nothing', 'no');
  // in-memory says a_lot+yes → base=3=ahead, no adj from a single-record streak
  expect(calculateGoalHealth(cur(W0, 'a_lot', 'yes'), [stored])).toBe('ahead');
});

// ─────────────────────────────────────────────────────────────────────────────
// (13) Final score clamped at boundaries
// ─────────────────────────────────────────────────────────────────────────────
it('(13) final score clamped — cannot drop below behind', () => {
  // nothing+no (base=0) with 3× stagnation → neg=-2; 0-2=-2 → clamped 0=behind
  expect(
    calculateGoalHealth(cur(W0, 'nothing', 'no'), [rec(W1, 'nothing', 'no'), rec(W2, 'nothing', 'no')]),
  ).toBe('behind');
});

// ─────────────────────────────────────────────────────────────────────────────
// (14) Recovery — strong current week after a bad streak
// ─────────────────────────────────────────────────────────────────────────────
it('(14) recovery — a_lot+yes after 2× nothing+no → ahead (no penalty)', () => {
  // current=a_lot+yes breaks every negative streak immediately (consecutive check stops at first non-match)
  // neg=0; pos: only 1× a_lot+yes (need 2+) → pos=0; base=3=ahead
  expect(
    calculateGoalHealth(cur(W0, 'a_lot', 'yes'), [rec(W1, 'nothing', 'no'), rec(W2, 'nothing', 'no')]),
  ).toBe('ahead');
});
