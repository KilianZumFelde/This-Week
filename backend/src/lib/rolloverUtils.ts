/** Pure predicate: should a carry-over ritual be created this week? */
export function shouldCreateRitual(openTaskCount: number, hasActiveGoals: boolean): boolean {
  return openTaskCount > 0 || hasActiveGoals;
}
