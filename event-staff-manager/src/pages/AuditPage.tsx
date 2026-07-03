import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../types';
import { getAuditLogs } from '../services/auditService';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/ui';
import { formatTimestampEs } from '../utils/time';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs(150)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const actionLabel: Record<string, string> = {
    CREATE: 'Creación',
    UPDATE: 'Actualización',
    DELETE: 'Eliminación',
    ARCHIVE: 'Archivo',
    PAY: 'Pago',
    UNPAY: 'Desmarcar pago',
  };

  const entityLabel: Record<string, string> = {
    staff: 'Personal',
    event: 'Evento',
    assignment: 'Turno',
    user: 'Usuario',
  };

  return (
    <div>
      <PageHeader title="Auditoría" subtitle="Registro de cambios en el sistema" />

      {loading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <EmptyState message="No hay registros de auditoría aún." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card-padded text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-blue">{actionLabel[log.action] || log.action}</span>
                    <span className="badge-gray">{entityLabel[log.entityType] || log.entityType}</span>
                  </div>
                  <p className="text-gray-700 mt-2">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.userEmail}</p>
                </div>
                <time className="text-xs text-gray-400 whitespace-nowrap">{formatTimestampEs(log.timestamp)}</time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
