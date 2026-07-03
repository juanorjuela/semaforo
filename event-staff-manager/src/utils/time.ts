const HALF_HOUR_MS = 30 * 60 * 1000;

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

export function roundToHalfHour(hours: number): number {
  return Math.round(hours * 2) / 2;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return calculateHoursFromTimes(startTime, endTime) > 0;
}

export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function formatDateEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLongEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export { HALF_HOUR_MS };
