export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDateGroup(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const startOfWeek = new Date(today.getTime() - today.getDay() * 86400000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= startOfWeek) return "This Week";
  if (d >= startOfMonth) return "This Month";
  return "Older";
}

export const DATE_GROUPS = [
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "Older",
];

export function groupByDate<T extends { created_at: string }>(
  items: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const group = getDateGroup(item.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  }
  return groups;
}
