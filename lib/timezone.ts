/**
 * Shared IST (Asia/Kolkata) date and timestamp utilities so scheduling validation
 * aligns across UI modals and PostgreSQL (AT TIME ZONE 'Asia/Kolkata').
 */

export function getISTDateString(daysAhead: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function parseISTTimestamp(dateStr: string, timeStr: string): number {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${normalizedTime}+05:30`).getTime();
}

export function isISTDateTimeInFuture(dateStr: string, timeStr: string): boolean {
  const ts = parseISTTimestamp(dateStr, timeStr);
  return !Number.isNaN(ts) && ts > Date.now();
}

