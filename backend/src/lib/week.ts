/**
 * Returns the most recent Sunday (week_start_date) in the given IANA timezone.
 * Week starts Sunday 00:00 local time per DATABASE_DESIGN.md § Week Definition.
 */
export function getCurrentWeekStartDate(timezone: string): string {
  const now = new Date();

  // Get the current day-of-week in the target timezone (0=Sun, 6=Sat)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value; // 'Sun', 'Mon', …
  const year = parts.find((p) => p.type === 'year')?.value!;
  const month = parts.find((p) => p.type === 'month')?.value!;
  const day = parts.find((p) => p.type === 'day')?.value!;

  const weekdayIndex: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOffset = weekdayIndex[weekday ?? 'Sun'] ?? 0;

  // Parse local date and subtract offset days to get the most recent Sunday
  const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
  localDate.setDate(localDate.getDate() - dayOffset);

  const sy = localDate.getFullYear();
  const sm = String(localDate.getMonth() + 1).padStart(2, '0');
  const sd = String(localDate.getDate()).padStart(2, '0');
  return `${sy}-${sm}-${sd}`;
}
