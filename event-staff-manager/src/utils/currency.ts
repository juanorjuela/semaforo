export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculatePayment(hours: number, hourlyWage: number): number {
  return Math.round(hours * hourlyWage);
}

export function parseCopInput(value: string): number | undefined {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return undefined;
  return parseInt(cleaned, 10);
}
