/**
 * Converts a naive local datetime string (YYYY-MM-DDTHH:MM:SS, no offset) to a UTC ISO string.
 * Uses Intl.DateTimeFormat to determine the correct offset including DST.
 */
export function localToUTC(localIso: string, timezone: string): string {
  // Treat the naive string as UTC temporarily so we can call Intl on it
  const asUTC = new Date(localIso + 'Z');

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(asUTC);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0');

  let h = get('hour');
  if (h === 24) h = 0; // Intl returns 24 for midnight in some environments

  // shownMs = what Intl says the local clock reads for asUTC, expressed as a UTC epoch number
  const shownMs = Date.UTC(get('year'), get('month') - 1, get('day'), h, get('minute'), get('second'));

  // offsetMs = how far ahead the timezone is from UTC at this instant
  const offsetMs = shownMs - asUTC.getTime();

  return new Date(asUTC.getTime() - offsetMs).toISOString();
}

/** Returns the Sunday one week before the given YYYY-MM-DD date string. */
export function getPreviousWeekStartDate(weekStartDate: string): string {
  const d = new Date(`${weekStartDate}T00:00:00`);
  d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
