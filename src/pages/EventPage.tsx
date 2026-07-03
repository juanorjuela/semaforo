import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Event, EventDay, StaffMember } from '../types';
import {
  getEvents,
  getActiveEvent,
  createEvent,
  setEventStatus,
  getEventDays,
  deleteEvent,
} from '../services/eventService';
import {
  getAssignmentsWithStaffForDay,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  markAssignmentPaid,
  markAllDayPaid,
} from '../services/assignmentService';
import { getActiveStaff } from '../services/staffService';
import {
  PageHeader,
  EmptyState,
  LoadingSpinner,
  Alert,
  Modal,
  StatCard,
} from '../components/ui';
import { formatDateEs, formatDateLongEs, isValidTimeRange } from '../utils/time';
import { formatCop } from '../utils/currency';
import { exportDayPayrollCsv } from '../utils/csv';
import { createRequestGuard } from '../utils/async';
import { getFirebaseErrorMessage } from '../utils/errors';
import { PlusIcon, TrashIcon, CheckCircleIcon, EyeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EventPage() {
  const { firebaseUser, appUser, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [displayEvent, setDisplayEvent] = useState<Event | null>(null);
  const [days, setDays] = useState<EventDay[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [assignments, setAssignments] = useState<Awaited<ReturnType<typeof getAssignmentsWithStaffForDay>>>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    name: '',
    venueName: '',
    startDate: '',
    endDate: '',
  });

  const [assignForm, setAssignForm] = useState({
    staffMemberId: '',
    startTime: '09:00',
    endTime: '17:00',
  });

  const selectedDay = days[selectedDayIndex];
  const isReadOnly = displayEvent?.status === 'completed';
  const isViewingHistory = displayEvent && activeEvent && displayEvent.id !== activeEvent.id;
  const pastEvents = events.filter((e) => e.status === 'completed' || (e.status === 'draft' && e.id !== activeEvent?.id));

  const loadGuard = useRef(createRequestGuard());

  const loadDayData = useCallback(async (eventId: string, dayId: string) => {
    const requestId = loadGuard.current.next();
    const [dayAssignments, activeStaff] = await Promise.all([
      getAssignmentsWithStaffForDay(dayId),
      getActiveStaff(),
    ]);
    if (!loadGuard.current.isCurrent(requestId)) return;
    setAssignments(dayAssignments);
    setStaff(activeStaff);
  }, []);

  const loadEventView = useCallback(async (event: Event) => {
    const requestId = loadGuard.current.next();
    const eventDays = await getEventDays(event.id);
    if (!loadGuard.current.isCurrent(requestId)) return;
    setDisplayEvent(event);
    setDays(eventDays);
    setSelectedDayIndex(0);
    if (eventDays.length === 0) {
      setAssignments([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allEvents, active] = await Promise.all([getEvents(), getActiveEvent()]);
      setEvents(allEvents);
      setActiveEvent(active);
      if (active) {
        await loadEventView(active);
      } else {
        setDisplayEvent(null);
        setDays([]);
        setAssignments([]);
      }
    } catch {
      setAlert({ type: 'error', message: 'Error al cargar el evento.' });
    } finally {
      setLoading(false);
    }
  }, [loadEventView]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (displayEvent && selectedDay) {
      loadDayData(displayEvent.id, selectedDay.id);
    }
  }, [selectedDayIndex, displayEvent?.id, selectedDay, loadDayData, displayEvent]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateEventError(null);

    if (!firebaseUser || !appUser) {
      setCreateEventError('Sesión no válida. Cierra sesión e inicia de nuevo.');
      return;
    }

    if (!eventForm.name.trim() || !eventForm.venueName.trim()) {
      setCreateEventError('Completa el nombre y el lugar del evento.');
      return;
    }

    if (!eventForm.startDate || !eventForm.endDate) {
      setCreateEventError('Selecciona las fechas de inicio y fin.');
      return;
    }

    if (eventForm.endDate < eventForm.startDate) {
      setCreateEventError('La fecha fin debe ser igual o posterior a la fecha inicio.');
      return;
    }

    setCreatingEvent(true);
    try {
      await createEvent(
        { ...eventForm, name: eventForm.name.trim(), venueName: eventForm.venueName.trim(), status: 'active' },
        firebaseUser.uid,
        appUser.email
      );
      setCreateEventOpen(false);
      setEventForm({ name: '', venueName: '', startDate: '', endDate: '' });
      setCreateEventError(null);
      setAlert({ type: 'success', message: 'Evento creado y activado.' });
      const active = await getActiveEvent();
      setActiveEvent(active);
      const allEvents = await getEvents();
      setEvents(allEvents);
      if (active) await loadEventView(active);
    } catch (err) {
      console.error('Error creating event:', err);
      setCreateEventError(getFirebaseErrorMessage(err, 'Error al crear el evento. Intenta de nuevo.'));
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleActivateEvent = async (event: Event) => {
    if (!firebaseUser || !appUser) return;
    if (event.status === 'completed' && !isSuperAdmin) {
      setAlert({ type: 'error', message: 'Solo Super Admin puede reactivar eventos completados.' });
      return;
    }
    try {
      await setEventStatus(event.id, 'active', firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: `"${event.name}" activado.` });
      const [active, allEvents] = await Promise.all([getActiveEvent(), getEvents()]);
      setActiveEvent(active);
      setEvents(allEvents);
      if (active) await loadEventView(active);
    } catch {
      setAlert({ type: 'error', message: 'Error al activar evento.' });
    }
  };

  const handleViewEvent = async (event: Event) => {
    await loadEventView(event);
    setShowHistory(false);
  };

  const handleBackToActive = async () => {
    if (activeEvent) await loadEventView(activeEvent);
  };

  const handleBackToList = () => {
    setDisplayEvent(null);
    setDays([]);
    setAssignments([]);
  };

  const handleCompleteEvent = async () => {
    if (!displayEvent || !firebaseUser || !appUser || displayEvent.status !== 'active') return;
    if (!window.confirm('¿Marcar este evento como completado? Quedará en solo lectura.')) return;
    try {
      await setEventStatus(displayEvent.id, 'completed', firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: 'Evento completado.' });
      load();
    } catch {
      setAlert({ type: 'error', message: 'Error al completar evento.' });
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!firebaseUser || !appUser || !isSuperAdmin) return;
    if (!window.confirm(`¿Eliminar "${event.name}" y todos sus datos?`)) return;
    try {
      await deleteEvent(event.id, event.name, firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: 'Evento eliminado.' });
      load();
    } catch {
      setAlert({ type: 'error', message: 'Error al eliminar evento.' });
    }
  };

  const openAssign = (assignmentId?: string) => {
    if (isReadOnly) return;
    setAssignError(null);
    if (assignmentId) {
      const a = assignments.find((x) => x.id === assignmentId);
      if (a) {
        setEditingAssignment(assignmentId);
        setAssignForm({
          staffMemberId: a.staffMemberId,
          startTime: a.startTime,
          endTime: a.endTime,
        });
      }
    } else {
      setEditingAssignment(null);
      setAssignForm({ staffMemberId: '', startTime: '09:00', endTime: '17:00' });
    }
    setAssignModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    if (!firebaseUser || !appUser || !displayEvent || !selectedDay || isReadOnly) {
      setAssignError('No se puede asignar en este momento. Recarga la página.');
      return;
    }

    const member = staff.find((s) => s.id === assignForm.staffMemberId);
    if (!editingAssignment && !assignForm.staffMemberId) {
      setAssignError('Selecciona un miembro del personal.');
      return;
    }
    if (!member?.defaultHourlyWage) {
      setAssignError('El personal debe tener tarifa por hora configurada.');
      return;
    }
    if (!isValidTimeRange(assignForm.startTime, assignForm.endTime)) {
      setAssignError('Rango de horario inválido.');
      return;
    }

    setAssigning(true);
    try {
      if (editingAssignment) {
        await updateAssignment(
          editingAssignment,
          assignForm.startTime,
          assignForm.endTime,
          member.defaultHourlyWage,
          firebaseUser.uid,
          appUser.email
        );
        setAlert({ type: 'success', message: 'Turno actualizado.' });
      } else {
        await createAssignment(
          displayEvent.id,
          selectedDay.id,
          assignForm.staffMemberId,
          assignForm.startTime,
          assignForm.endTime,
          member.defaultHourlyWage,
          firebaseUser.uid,
          appUser.email
        );
        setAlert({ type: 'success', message: 'Personal asignado.' });
      }
      setAssignModalOpen(false);
      setAssignError(null);
      loadDayData(displayEvent.id, selectedDay.id);
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : getFirebaseErrorMessage(err, 'Error al asignar. Intenta de nuevo.')
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!firebaseUser || !appUser || !displayEvent || !selectedDay || isReadOnly) return;
    if (!window.confirm('¿Quitar esta asignación?')) return;
    try {
      await deleteAssignment(id, firebaseUser.uid, appUser.email);
      loadDayData(displayEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al eliminar asignación.' });
    }
  };

  const handleTogglePaid = async (id: string, current: string) => {
    if (!firebaseUser || !appUser || !displayEvent || !selectedDay || isReadOnly) return;
    try {
      if (current === 'paid') {
        const { markAssignmentPending } = await import('../services/assignmentService');
        await markAssignmentPending(id, firebaseUser.uid, appUser.email);
      } else {
        await markAssignmentPaid(id, firebaseUser.uid, appUser.email);
      }
      loadDayData(displayEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al actualizar pago.' });
    }
  };

  const handleMarkAllPaid = async () => {
    if (!firebaseUser || !appUser || !selectedDay || !displayEvent || isReadOnly) return;
    try {
      const count = await markAllDayPaid(selectedDay.id, firebaseUser.uid, appUser.email);
      setAlert({
        type: 'success',
        message: count > 0 ? `${count} pagos marcados.` : 'No hay pagos pendientes.',
      });
      loadDayData(displayEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al marcar pagos.' });
    }
  };

  const totalHours = assignments.reduce((s, a) => s + a.hoursWorked, 0);
  const totalPay = assignments.reduce((s, a) => s + a.paymentAmount, 0);
  const pendingCount = assignments.filter((a) => a.paymentStatus === 'pending').length;

  const assignedIds = new Set(assignments.map((a) => a.staffMemberId));
  const availableStaff = staff.filter((s) => !assignedIds.has(s.id) || editingAssignment);

  const statusBadge = (status: Event['status']) => {
    const labels = { active: 'Activo', completed: 'Completado', draft: 'Borrador' };
    const classes = {
      active: 'badge-green',
      completed: 'badge-gray',
      draft: 'badge-yellow',
    };
    return <span className={`badge mt-2 ${classes[status]}`}>{labels[status]}</span>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {!displayEvent ? (
        <>
          <PageHeader
            title="Eventos"
            subtitle="Crea o activa un evento para comenzar"
            action={
              <button onClick={() => { setCreateEventError(null); setCreateEventOpen(true); }} className="btn-primary">
                <PlusIcon className="w-4 h-4" />
                Nuevo evento
              </button>
            }
          />
          {events.length === 0 ? (
            <EmptyState
              message="No hay eventos. Crea tu primer festival o evento."
              action={
                <button onClick={() => { setCreateEventError(null); setCreateEventOpen(true); }} className="btn-primary">
                  Crear evento
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">Historial de eventos</p>
              {events.map((event) => (
                <div key={event.id} className="card-padded flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm text-gray-500">{event.venueName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.startDate} — {event.endDate}
                    </p>
                    {statusBadge(event.status)}
                  </div>
                  <div className="flex flex-col gap-2">
                    {event.status === 'completed' && (
                      <button onClick={() => handleViewEvent(event)} className="btn-secondary btn-sm">
                        <EyeIcon className="w-4 h-4" />
                        Ver
                      </button>
                    )}
                    {event.status !== 'active' && (
                      <button
                        onClick={() => handleActivateEvent(event)}
                        className="btn-primary btn-sm"
                        disabled={event.status === 'completed' && !isSuperAdmin}
                      >
                        Activar
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button onClick={() => handleDeleteEvent(event)} className="btn-danger btn-sm">
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {isReadOnly && (
            <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm text-gray-600">
              Solo lectura — evento completado
              {isSuperAdmin && (
                <button
                  onClick={() => handleActivateEvent(displayEvent)}
                  className="btn-primary btn-sm ml-3"
                >
                  Reactivar
                </button>
              )}
            </div>
          )}

          {isViewingHistory && activeEvent && (
            <button onClick={handleBackToActive} className="btn-ghost btn-sm mb-3 -ml-1">
              <ArrowLeftIcon className="w-4 h-4" />
              Volver a {activeEvent.name}
            </button>
          )}

          {displayEvent && !activeEvent && (
            <button onClick={handleBackToList} className="btn-ghost btn-sm mb-3 -ml-1">
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </button>
          )}

          <PageHeader
            title={displayEvent.name}
            subtitle={`${displayEvent.venueName} · ${displayEvent.startDate} — ${displayEvent.endDate}`}
            action={
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => selectedDay && exportDayPayrollCsv(displayEvent, selectedDay.date, assignments)}
                  className="btn-secondary btn-sm"
                  disabled={assignments.length === 0}
                >
                  CSV
                </button>
                {!isReadOnly && isSuperAdmin && (
                  <button onClick={handleCompleteEvent} className="btn-secondary btn-sm">
                    Completar
                  </button>
                )}
              </div>
            }
          />

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  i === selectedDayIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                Día {i + 1}
                <span className="block text-[10px] opacity-80">{formatDateEs(day.date)}</span>
              </button>
            ))}
          </div>

          {selectedDay && (
            <p className="text-sm text-gray-500 mb-4">{formatDateLongEs(selectedDay.date)}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Personal" value={String(assignments.length)} />
            <StatCard label="Horas" value={`${totalHours}h`} />
            <StatCard label="Pago del día" value={formatCop(totalPay)} />
            <StatCard label="Pendientes" value={String(pendingCount)} sub="pagos" />
          </div>

          {!isReadOnly && (
            <div className="flex gap-2 mb-4">
              <button onClick={() => openAssign()} className="btn-primary flex-1">
                <PlusIcon className="w-4 h-4" />
                Asignar personal
              </button>
              {pendingCount > 0 && (
                <button onClick={handleMarkAllPaid} className="btn-secondary">
                  <CheckCircleIcon className="w-4 h-4" />
                  Pagar todo
                </button>
              )}
            </div>
          )}

          {assignments.length === 0 ? (
            <EmptyState message="No hay personal asignado para este día." />
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="card-padded">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{a.staffName}</h3>
                        <span className={a.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}>
                          {a.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {a.startTime} — {a.endTime} · {a.hoursWorked}h
                      </p>
                      <p className="text-sm font-semibold text-primary-600 mt-1">
                        {formatCop(a.paymentAmount)}
                      </p>
                    </div>
                    {!isReadOnly && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openAssign(a.id)} className="btn-ghost btn-sm">
                          Editar
                        </button>
                        <button
                          onClick={() => handleTogglePaid(a.id, a.paymentStatus)}
                          className="btn-ghost btn-sm"
                        >
                          {a.paymentStatus === 'paid' ? 'Desmarcar' : 'Pagado'}
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(a.id)}
                          className="btn-ghost btn-sm text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeEvent && pastEvents.length > 0 && !isViewingHistory && (
            <div className="mt-8 border-t pt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm font-medium text-primary-600 mb-3"
              >
                {showHistory ? '▲ Ocultar historial' : '▼ Historial de eventos'}
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="card-padded flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-gray-400">
                          {event.startDate} — {event.endDate}
                        </p>
                      </div>
                      <button onClick={() => handleViewEvent(event)} className="btn-secondary btn-sm">
                        <EyeIcon className="w-4 h-4" />
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={createEventOpen}
        onClose={() => {
          if (!creatingEvent) {
            setCreateEventOpen(false);
            setCreateEventError(null);
          }
        }}
        title="Nuevo evento"
        footer={
          <div className="space-y-2">
            {createEventError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {createEventError}
              </div>
            )}
            <button
              type="submit"
              form="create-event-form"
              className="btn-primary w-full min-h-[48px]"
              disabled={creatingEvent}
            >
              {creatingEvent ? 'Creando evento...' : 'Crear y activar evento'}
            </button>
          </div>
        }
      >
        <form id="create-event-form" onSubmit={handleCreateEvent} noValidate className="space-y-4">
          {createEventError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {createEventError}
            </div>
          )}
          <div>
            <label className="label">Nombre del evento</label>
            <input
              className="input"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Lugar / venue</label>
            <input
              className="input"
              value={eventForm.venueName}
              onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha inicio</label>
              <input
                type="date"
                className="input"
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Fecha fin</label>
              <input
                type="date"
                className="input"
                value={eventForm.endDate}
                min={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={assignModalOpen}
        onClose={() => {
          if (!assigning) {
            setAssignModalOpen(false);
            setAssignError(null);
          }
        }}
        title={editingAssignment ? 'Editar turno' : 'Asignar personal'}
        footer={
          <div className="space-y-2">
            {assignError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {assignError}
              </div>
            )}
            <button
              type="submit"
              form="assign-form"
              className="btn-primary w-full min-h-[48px]"
              disabled={assigning}
            >
              {assigning ? 'Guardando...' : editingAssignment ? 'Guardar turno' : 'Asignar'}
            </button>
          </div>
        }
      >
        <form id="assign-form" onSubmit={handleAssign} noValidate className="space-y-4">
          {assignError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {assignError}
            </div>
          )}
          {!editingAssignment && (
            <div>
              <label className="label">Personal</label>
              <select
                className="input"
                value={assignForm.staffMemberId}
                onChange={(e) => setAssignForm({ ...assignForm, staffMemberId: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.defaultHourlyWage ? ` — ${formatCop(s.defaultHourlyWage)}/h` : ' — sin tarifa'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hora inicio</label>
              <input
                type="time"
                className="input"
                value={assignForm.startTime}
                onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input
                type="time"
                className="input"
                value={assignForm.endTime}
                onChange={(e) => setAssignForm({ ...assignForm, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
