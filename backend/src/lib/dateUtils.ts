/** Returns the Sunday one week before the given YYYY-MM-DD date string. */
export function getPreviousWeekStartDate(weekStartDate: string): string {
  const d = new Date(`${weekStartDate}T00:00:00`);
  d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
