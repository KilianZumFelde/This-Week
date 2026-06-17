export type MilestoneDateValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateMilestoneDate(
  targetDate: string,
  goalTargetDate: string,
  today: string,
): MilestoneDateValidationResult {
  if (targetDate <= today) {
    return { ok: false, reason: 'Milestone date must be in the future.' };
  }
  if (targetDate > goalTargetDate) {
    return {
      ok: false,
      reason: `Must be on or before the goal's date (${goalTargetDate}).`,
    };
  }
  return { ok: true };
}
