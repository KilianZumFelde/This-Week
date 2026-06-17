// Cursor position for the This Week "Milestones" section.
// Returns the 0–1 marker position on the sm Track.
// committed=0 → caller should omit the row (returns 0 as a safe default).
// expected = committed * dayIndexInWeek/7 defines the on-pace threshold,
// but pos is simply the raw completion fraction so the track shows actual progress.
export function cursorPosition({
  committed,
  completed,
}: {
  committed: number;
  completed: number;
  dayIndexInWeek: number;
}): number {
  if (committed === 0) return 0;
  return Math.min(1, Math.max(0, completed / committed));
}
