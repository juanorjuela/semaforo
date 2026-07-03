import React, { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="card-padded text-center py-12">
      <p className="text-gray-500 mb-4">{message}</p>
      {action}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

export function Alert({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
}) {
  const styles =
    type === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-800 border-red-200';

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm mb-4 flex justify-between items-center ${styles}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 font-bold opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[90dvh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">{children}</div>
        {footer && (
          <div className="flex-shrink-0 border-t bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-padded">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
