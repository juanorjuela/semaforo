import { AssignmentWithStaff, Event } from '../types';

export function exportDayPayrollCsv(
  event: Event,
  date: string,
  assignments: AssignmentWithStaff[]
): void {
  const headers = [
    'Evento',
    'Fecha',
    'Nombre',
    'Inicio',
    'Fin',
    'Horas',
    'Tarifa/Hora (COP)',
    'Pago (COP)',
    'Estado',
  ];

  const csvContent = [
    headers.join(','),
    ...assignments.map((a) =>
      [
        escapeCsv(event.name),
        escapeCsv(date),
        escapeCsv(a.staffName),
        a.startTime,
        a.endTime,
        a.hoursWorked,
        a.hourlyWage,
        a.paymentAmount,
        escapeCsv(a.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'),
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nomina-${date}-${event.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportEventSummaryCsv(
  event: Event,
  daySummaries: { date: string; staffCount: number; totalHours: number; totalPay: number }[]
): void {
  const headers = ['Fecha', 'Personal', 'Horas Totales', 'Pago Total (COP)'];
  const csvContent = [
    headers.join(','),
    ...daySummaries.map((d) =>
      [d.date, d.staffCount, d.totalHours, d.totalPay].join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `resumen-${event.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
