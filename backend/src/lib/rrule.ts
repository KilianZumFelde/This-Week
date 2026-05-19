const BYDAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

export function nextOccurrenceFromRRule(rule: string, after: Date): Date {
  const freq = rule.match(/FREQ=(\w+)/)?.[1];
  const msPerDay = 24 * 60 * 60 * 1000;
  if (freq === 'WEEKLY') {
    const byday = rule.match(/BYDAY=([A-Z,]+)/)?.[1];
    if (byday) {
      const days = byday.split(',').map(d => BYDAY_MAP[d]).filter((d): d is number => d !== undefined);
      for (let i = 1; i <= 7; i++) {
        const candidate = new Date(after.getTime() + i * msPerDay);
        if (days.includes(candidate.getDay())) return candidate;
      }
    }
  }
  // FREQ=DAILY or fallback
  return new Date(after.getTime() + msPerDay);
}
