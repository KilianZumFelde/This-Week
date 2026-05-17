export function getCurrentWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = now.getDate() - day;
  const sunday = new Date(now);
  sunday.setDate(diff);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const d = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatWeekLabel(weekStartDate: string): string {
  const date = new Date(`${weekStartDate}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
