import { subtractWeeks } from './dateUtils.js';

export type HealthLevelValue = 'behind' | 'slightly_behind' | 'on_track' | 'ahead' | 'well_ahead';
export type ProgressAnswer = 'a_lot' | 'some' | 'barely' | 'nothing';
export type ConfidenceAnswer = 'yes' | 'maybe' | 'no';

export interface HealthRecord {
  goal_id: string;
  week_start_date: string;
  progress_answer: ProgressAnswer;
  confidence_answer: ConfidenceAnswer;
  health_level?: HealthLevelValue;
}

export interface CurrentHealthInput {
  goal_id: string;
  week_start_date: string;
  progress_answer: ProgressAnswer;
  confidence_answer: ConfidenceAnswer;
}

const MAX_HISTORY_WEEKS = 4;
const MIN_ADJUSTMENT = -2;
const MAX_ADJUSTMENT = 1;

// Conservative base scores: history is what lifts strong patterns to the top level.
// 0=behind  1=slightly_behind  2=on_track  3=ahead  4=well_ahead
const BASE_SCORES: Record<ProgressAnswer, Record<ConfidenceAnswer, number>> = {
  a_lot:   { yes: 3, maybe: 2, no: 1 },
  some:    { yes: 2, maybe: 2, no: 1 },
  barely:  { yes: 1, maybe: 1, no: 0 },
  nothing: { yes: 1, maybe: 1, no: 0 },
};

const SCORE_TO_LEVEL: HealthLevelValue[] = [
  'behind', 'slightly_behind', 'on_track', 'ahead', 'well_ahead',
];

function getBaseScore(progress: ProgressAnswer, confidence: ConfidenceAnswer): number {
  return BASE_SCORES[progress][confidence];
}

function scoreToHealthLevel(score: number): HealthLevelValue {
  return SCORE_TO_LEVEL[score];
}

// Count how many consecutive records starting from the current (index 0, newest) match the predicate.
// A break in the streak stops the count immediately — the current week is always first.
function countConsecutive(records: HealthRecord[], predicate: (r: HealthRecord) => boolean): number {
  let count = 0;
  for (const r of records) {
    if (predicate(r)) count++;
    else break;
  }
  return count;
}

/**
 * Build the contiguous window used for pattern detection.
 * Returns records newest→oldest, always starting with the in-memory current week.
 * Stops at the first missing week (gap); caps at MAX_HISTORY_WEEKS total.
 * The in-memory current takes priority over any stored record for the same week.
 */
export function getRecentContiguousRecords(
  current: CurrentHealthInput,
  historicalRecords: HealthRecord[],
): HealthRecord[] {
  const forGoal = historicalRecords.filter((r) => r.goal_id === current.goal_id);

  // Keyed by week; first-seen wins (handles duplicates in the incoming list)
  const byWeek = new Map<string, HealthRecord>();
  for (const r of forGoal) {
    if (!byWeek.has(r.week_start_date)) byWeek.set(r.week_start_date, r);
  }

  const result: HealthRecord[] = [{ ...current }];

  for (let n = 1; n < MAX_HISTORY_WEEKS; n++) {
    const prevWeek = subtractWeeks(current.week_start_date, n);
    const record = byWeek.get(prevWeek);
    if (record) result.push(record);
    else break;
  }

  return result;
}

/**
 * Compute the negative adjustment from up to three independent patterns.
 * Each pattern counts consecutive matching weeks starting from the current.
 * A strong current week (high confidence/progress) breaks the streak and prevents any penalty.
 * Takes the strongest (most negative) single pattern — patterns do NOT stack.
 */
export function getNegativeAdjustment(records: HealthRecord[]): number {
  // Pattern 1: repeated low confidence
  const noStreak = countConsecutive(records, (r) => r.confidence_answer === 'no');
  const notYesStreak = countConsecutive(records, (r) => r.confidence_answer !== 'yes');
  let p1 = 0;
  if (noStreak >= 3) p1 = -2;
  else if (noStreak >= 2) p1 = -1;
  else if (notYesStreak >= 3) p1 = -1;

  // Pattern 2: repeated stagnation (low progress AND low confidence)
  const stagnationStreak = countConsecutive(
    records,
    (r) =>
      (r.progress_answer === 'barely' || r.progress_answer === 'nothing') &&
      (r.confidence_answer === 'maybe' || r.confidence_answer === 'no'),
  );
  let p2 = 0;
  if (stagnationStreak >= 3) p2 = -2;
  else if (stagnationStreak >= 2) p2 = -1;

  // Pattern 3: repeated nothing progress
  const nothingStreak = countConsecutive(records, (r) => r.progress_answer === 'nothing');
  let p3 = 0;
  if (nothingStreak >= 3) p3 = -2;
  else if (nothingStreak >= 2) p3 = -1;

  return Math.max(MIN_ADJUSTMENT, Math.min(0, p1, p2, p3));
}

/**
 * Compute the positive adjustment. Only called when no negative applies.
 * Requires a consecutive streak of strong weeks starting from the current.
 */
export function getPositiveAdjustment(records: HealthRecord[]): number {
  const aLotYesStreak = countConsecutive(
    records,
    (r) => r.progress_answer === 'a_lot' && r.confidence_answer === 'yes',
  );
  const strongYesStreak = countConsecutive(
    records,
    (r) => (r.progress_answer === 'a_lot' || r.progress_answer === 'some') && r.confidence_answer === 'yes',
  );

  if (aLotYesStreak >= 2) return MAX_ADJUSTMENT;
  if (strongYesStreak >= 3) return MAX_ADJUSTMENT;
  return 0;
}

/**
 * History-aware goal health calculation.
 * Base score comes from this week's answers; history adjusts by at most ±1–2 notches.
 * A strong current week always allows recovery — patterns only fire when the current week
 * also shows the problematic (or healthy) behaviour consecutively.
 */
export function calculateGoalHealth(
  current: CurrentHealthInput,
  historicalRecords: HealthRecord[],
): HealthLevelValue {
  const records = getRecentContiguousRecords(current, historicalRecords);
  const base = getBaseScore(current.progress_answer, current.confidence_answer);
  const neg = getNegativeAdjustment(records);
  const adj = neg < 0 ? neg : getPositiveAdjustment(records);
  return scoreToHealthLevel(Math.max(0, Math.min(4, base + adj)));
}

/** Backward-compat wrapper — returns the base score only (no history). */
export function computeHealthLevel(
  progress: ProgressAnswer,
  confidence: ConfidenceAnswer,
): HealthLevelValue {
  return scoreToHealthLevel(getBaseScore(progress, confidence));
}
