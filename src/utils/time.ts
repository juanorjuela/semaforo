export const BOGOTA_TZ = 'America/Bogota';

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateHoursFromTimes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);
  if (end <= start) {
    end += 24 * 60;
  }
  const rawHours = (end - start) / 60;
  return Math.round(rawHours * 2) / 2;
}

export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const fraction = hours - whole;
  if (fraction === 0) return `${whole}h`;
  return `${whole}h 30m`;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return calculateHoursFromTimes(startTime, endTime) > 0;
}

function addDaysToIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return date.toISOString().split('T')[0];
}

export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDaysToIso(current, 1);
  }
  return dates;
}

const dateFormatOpts = { timeZone: BOGOTA_TZ } as const;

export function formatDateEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return date.toLocaleDateString('es-CO', {
    ...dateFormatOpts,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLongEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return date.toLocaleDateString('es-CO', {
    ...dateFormatOpts,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BOGOTA_TZ });
}

export function formatTimestampEs(ts: number): string {
  return new Date(ts).toLocaleString('es-CO', {
    timeZone: BOGOTA_TZ,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
