/**
 * Returns a human-readable relative label for a date string ("YYYY-MM-DD").
 *
 * @param showAnniversary - When true, highlights "One year ago today" / "X years ago today"
 *   when the date falls on the same calendar day as today. Intended for past-memory surfaces.
 */
export function getRelativeLabel(dateStr: string, options?: { showAnniversary?: boolean }): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date      = new Date(y, m - 1, d);
  const now       = new Date();
  const diffDays  = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const years     = Math.floor(diffDays / 365);
  const months    = Math.floor(diffDays / 30);
  const weeks     = Math.floor(diffDays / 7);

  if (options?.showAnniversary && years >= 1) {
    const isSameDay = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
    const yearLabel = `${years === 1 ? 'One' : years} year${years > 1 ? 's' : ''}`;
    return isSameDay ? `${yearLabel} ago today` : `${yearLabel} ago`;
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays} days ago`;
  if (diffDays < 30)  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Formats a "YYYY-MM-DD" string to a date label (uppercase by default).
 *
 * @param format
 *   - `'short'` (default): "WED, APR 9, 2025" — short weekday + short month
 *   - `'long'`:  "APRIL 9, 2025"              — long month, no weekday
 *   - `'full'`:  "WEDNESDAY, APRIL 9, 2025"   — long weekday + long month
 * @param uppercase - Pass `false` to skip uppercasing (e.g. for tooltip strings). Defaults to `true`.
 */
export function getFormattedDate(
  dateStr: string,
  options?: { format?: 'short' | 'long' | 'full'; uppercase?: boolean },
): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const up   = options?.uppercase !== false;

  let result: string;
  if (options?.format === 'full') {
    result = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else if (options?.format === 'long') {
    result = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } else {
    result = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  return up ? result.toUpperCase() : result;
}

/** Returns today's date as a "YYYY-MM-DD" string (local time). */
export function getTodayDateStr(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/**
 * Formats an ISO datetime string to "14 Apr 2026 · 09:22".
 * Intended for session / timestamp display.
 */
export function formatSessionDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
