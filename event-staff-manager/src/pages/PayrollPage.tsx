import React, { useEffect, useState } from 'react';
import { Event, EventDay } from '../types';
import { getEvents, getActiveEvent, getEventDays } from '../services/eventService';
import { getAssignmentsWithStaffForEvent } from '../services/assignmentService';
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from '../components/ui';
import { formatCop } from '../utils/currency';
import { formatDateEs } from '../utils/time';
import { exportEventSummaryCsv, exportDayPayrollCsv } from '../utils/csv';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface DayPayroll {
  day: EventDay;
  assignments: Awaited<ReturnType<typeof getAssignmentsWithStaffForEvent>>;
  totalHours: number;
  totalPay: number;
  pending: number;
  paid: number;
}

export default function PayrollPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [dayPayrolls, setDayPayrolls] = useState<DayPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [allEvents, active] = await Promise.all([getEvents(), getActiveEvent()]);
        setEvents(allEvents);
        const defaultId = active?.id || allEvents[0]?.id || '';
        setSelectedEventId(defaultId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setDayPayrolls([]);
      return;
    }

    const loadPayroll = async () => {
      setLoading(true);
      try {
        const event = events.find((e) => e.id === selectedEventId);
        if (!event) return;

        const days = await getEventDays(selectedEventId);
        const allAssignments = await getAssignmentsWithStaffForEvent(selectedEventId);

        const payrolls: DayPayroll[] = days.map((day) => {
          const dayAssignments = allAssignments.filter((a) => a.eventDayId === day.id);
          return {
            day,
            assignments: dayAssignments,
            totalHours: dayAssignments.reduce((s, a) => s + a.hoursWorked, 0),
            totalPay: dayAssignments.reduce((s, a) => s + a.paymentAmount, 0),
            pending: dayAssignments.filter((a) => a.paymentStatus === 'pending').length,
            paid: dayAssignments.filter((a) => a.paymentStatus === 'paid').length,
          };
        });
        setDayPayrolls(payrolls);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPayroll();
  }, [selectedEventId, events]);

  if (loading && events.length === 0) return <LoadingSpinner />;

  if (events.length === 0) {
    return (
      <div>
        <PageHeader title="Nómina" subtitle="Resumen de pagos por evento" />
        <EmptyState message="No hay eventos. Crea uno para ver la nómina." />
      </div>
    );
  }

  const eventTotalHours = dayPayrolls.reduce((s, d) => s + d.totalHours, 0);
  const eventTotalPay = dayPayrolls.reduce((s, d) => s + d.totalPay, 0);
  const eventPending = dayPayrolls.reduce((s, d) => s + d.pending, 0);

  return (
    <div>
      <PageHeader
        title="Nómina"
        subtitle="Resumen de pagos por evento"
        action={
          selectedEvent && (
            <button
              onClick={() =>
                exportEventSummaryCsv(
                  selectedEvent,
                  dayPayrolls.map((d) => ({
                    date: d.day.date,
                    staffCount: d.assignments.length,
                    totalHours: d.totalHours,
                    totalPay: d.totalPay,
                  }))
                )
              }
              className="btn-secondary"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar
            </button>
          )
        }
      />

      <div className="mb-6">
        <label className="label">Evento</label>
        <select
          className="input"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.status === 'active' ? 'Activo' : e.status === 'completed' ? 'Completado' : 'Borrador'})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : selectedEvent ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <StatCard label="Total horas" value={`${eventTotalHours}h`} />
            <StatCard label="Pago total" value={formatCop(eventTotalPay)} />
            <StatCard label="Pagos pendientes" value={String(eventPending)} />
          </div>

          <div className="space-y-3">
            {dayPayrolls.map((dp, i) => (
              <div key={dp.day.id} className="card overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
                  onClick={() => setExpandedDay(expandedDay === dp.day.id ? null : dp.day.id)}
                >
                  <div>
                    <p className="font-semibold">
                      Día {i + 1} — {formatDateEs(dp.day.date)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {dp.assignments.length} personas · {dp.totalHours}h · {formatCop(dp.totalPay)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dp.pending > 0 && (
                      <span className="badge-yellow">
                        {dp.pending} pendiente{dp.pending > 1 ? 's' : ''}
                      </span>
                    )}
                    {dp.paid > 0 && dp.pending === 0 && (
                      <span className="badge-green">Todo pagado</span>
                    )}
                    <span className="text-gray-400">{expandedDay === dp.day.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedDay === dp.day.id && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => exportDayPayrollCsv(selectedEvent, dp.day.date, dp.assignments)}
                        className="btn-secondary btn-sm"
                        disabled={dp.assignments.length === 0}
                      >
                        <ArrowDownTrayIcon className="w-3 h-3" />
                        CSV del día
                      </button>
                    </div>
                    {dp.assignments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Sin asignaciones</p>
                    ) : (
                      <div className="space-y-2">
                        {dp.assignments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{a.staffName}</p>
                              <p className="text-gray-500 text-xs">
                                {a.startTime}-{a.endTime} · {a.hoursWorked}h
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary-600">{formatCop(a.paymentAmount)}</p>
                              <span
                                className={`text-[10px] ${
                                  a.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                }`}
                              >
                                {a.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
