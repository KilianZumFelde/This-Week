/**
 * Danger-zone nudge formula from requirements-lens § Habit danger-zone nudge.
 * Returns true when a nudge should be sent for a habit this week.
 *
 * Formula: count_remaining + 1 >= days_left
 * The +1 accounts for the urgency margin — one fewer day than remaining needed.
 */
export function isDangerZone(params: {
  weeklyTarget: number;
  completedCount: number;
  daysLeft: number;
}): boolean {
  const { weeklyTarget, completedCount, daysLeft } = params;
  const countRemaining = weeklyTarget - completedCount;
  // Already hit — no nudge
  if (countRemaining <= 0) return false;
  // Danger zone: you need to do almost every remaining day to hit the target
  return countRemaining + 1 >= daysLeft;
}

/**
 * Days remaining in the week (inclusive of today) for a given local day index.
 * Sun=0, Mon=1, … Sat=6
 */
export function daysLeftInWeek(todayIndex: number): number {
  return 7 - todayIndex;
}
