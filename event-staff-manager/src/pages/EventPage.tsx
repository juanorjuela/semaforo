import React, { useEffect, useState } from 'react';
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
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function EventPage() {
  const { firebaseUser, appUser, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [days, setDays] = useState<EventDay[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [assignments, setAssignments] = useState<Awaited<ReturnType<typeof getAssignmentsWithStaffForDay>>>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
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

  const loadEvents = async () => {
    const [allEvents, active] = await Promise.all([getEvents(), getActiveEvent()]);
    setEvents(allEvents);
    setActiveEvent(active);
    return active;
  };

  const loadDayData = async (eventId: string, dayId: string) => {
    const [dayAssignments, activeStaff] = await Promise.all([
      getAssignmentsWithStaffForDay(dayId),
      getActiveStaff(),
    ]);
    setAssignments(dayAssignments);
    setStaff(activeStaff);
  };

  const load = async () => {
    setLoading(true);
    try {
      const active = await loadEvents();
      if (active) {
        const eventDays = await getEventDays(active.id);
        setDays(eventDays);
        if (eventDays.length > 0) {
          await loadDayData(active.id, eventDays[selectedDayIndex]?.id || eventDays[0].id);
        }
      } else {
        setDays([]);
        setAssignments([]);
      }
    } catch {
      setAlert({ type: 'error', message: 'Error al cargar el evento.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeEvent && selectedDay) {
      loadDayData(activeEvent.id, selectedDay.id);
    }
  }, [selectedDayIndex, activeEvent?.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !appUser) return;
    try {
      const id = await createEvent(
        { ...eventForm, status: 'active' },
        firebaseUser.uid,
        appUser.email
      );
      setCreateEventOpen(false);
      setEventForm({ name: '', venueName: '', startDate: '', endDate: '' });
      setAlert({ type: 'success', message: 'Evento creado y activado.' });
      await loadEvents();
      const eventDays = await getEventDays(id);
      setDays(eventDays);
      setSelectedDayIndex(0);
      const active = await getActiveEvent();
      setActiveEvent(active);
      if (eventDays[0]) await loadDayData(id, eventDays[0].id);
    } catch {
      setAlert({ type: 'error', message: 'Error al crear el evento.' });
    }
  };

  const handleActivateEvent = async (event: Event) => {
    if (!firebaseUser || !appUser) return;
    try {
      await setEventStatus(event.id, 'active', firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: `"${event.name}" activado.` });
      const active = await getActiveEvent();
      setActiveEvent(active);
      if (active) {
        const eventDays = await getEventDays(active.id);
        setDays(eventDays);
        setSelectedDayIndex(0);
        if (eventDays[0]) await loadDayData(active.id, eventDays[0].id);
      }
      await loadEvents();
    } catch {
      setAlert({ type: 'error', message: 'Error al activar evento.' });
    }
  };

  const handleCompleteEvent = async () => {
    if (!activeEvent || !firebaseUser || !appUser) return;
    if (!window.confirm('¿Marcar este evento como completado?')) return;
    try {
      await setEventStatus(activeEvent.id, 'completed', firebaseUser.uid, appUser.email);
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
    if (!firebaseUser || !appUser || !activeEvent || !selectedDay) return;

    const member = staff.find((s) => s.id === assignForm.staffMemberId);
    if (!member?.defaultHourlyWage) {
      setAlert({ type: 'error', message: 'El personal debe tener tarifa por hora configurada.' });
      return;
    }
    if (!isValidTimeRange(assignForm.startTime, assignForm.endTime)) {
      setAlert({ type: 'error', message: 'Rango de horario inválido.' });
      return;
    }

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
          activeEvent.id,
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
      loadDayData(activeEvent.id, selectedDay.id);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al asignar.',
      });
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!firebaseUser || !appUser || !activeEvent || !selectedDay) return;
    if (!window.confirm('¿Quitar esta asignación?')) return;
    try {
      await deleteAssignment(id, firebaseUser.uid, appUser.email);
      loadDayData(activeEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al eliminar asignación.' });
    }
  };

  const handleTogglePaid = async (id: string, current: string) => {
    if (!firebaseUser || !appUser || !activeEvent || !selectedDay) return;
    try {
      if (current === 'paid') {
        const { markAssignmentPending } = await import('../services/assignmentService');
        await markAssignmentPending(id, firebaseUser.uid, appUser.email);
      } else {
        await markAssignmentPaid(id, firebaseUser.uid, appUser.email);
      }
      loadDayData(activeEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al actualizar pago.' });
    }
  };

  const handleMarkAllPaid = async () => {
    if (!firebaseUser || !appUser || !selectedDay || !activeEvent) return;
    try {
      await markAllDayPaid(selectedDay.id, firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: 'Todos los pagos del día marcados.' });
      loadDayData(activeEvent.id, selectedDay.id);
    } catch {
      setAlert({ type: 'error', message: 'Error al marcar pagos.' });
    }
  };

  const totalHours = assignments.reduce((s, a) => s + a.hoursWorked, 0);
  const totalPay = assignments.reduce((s, a) => s + a.paymentAmount, 0);
  const pendingCount = assignments.filter((a) => a.paymentStatus === 'pending').length;

  const assignedIds = new Set(assignments.map((a) => a.staffMemberId));
  const availableStaff = staff.filter((s) => !assignedIds.has(s.id) || editingAssignment);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {!activeEvent ? (
        <>
          <PageHeader
            title="Eventos"
            subtitle="Crea o activa un evento para comenzar"
            action={
              <button onClick={() => setCreateEventOpen(true)} className="btn-primary">
                <PlusIcon className="w-4 h-4" />
                Nuevo evento
              </button>
            }
          />
          {events.length === 0 ? (
            <EmptyState
              message="No hay eventos. Crea tu primer festival o evento."
              action={
                <button onClick={() => setCreateEventOpen(true)} className="btn-primary">
                  Crear evento
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="card-padded flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm text-gray-500">{event.venueName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.startDate} — {event.endDate}
                    </p>
                    <span
                      className={`badge mt-2 ${
                        event.status === 'active'
                          ? 'badge-green'
                          : event.status === 'completed'
                          ? 'badge-gray'
                          : 'badge-yellow'
                      }`}
                    >
                      {event.status === 'active'
                        ? 'Activo'
                        : event.status === 'completed'
                        ? 'Completado'
                        : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {event.status !== 'active' && (
                      <button onClick={() => handleActivateEvent(event)} className="btn-primary btn-sm">
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
          <PageHeader
            title={activeEvent.name}
            subtitle={`${activeEvent.venueName} · ${activeEvent.startDate} — ${activeEvent.endDate}`}
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => selectedDay && exportDayPayrollCsv(activeEvent, selectedDay.date, assignments)}
                  className="btn-secondary btn-sm"
                  disabled={assignments.length === 0}
                >
                  CSV
                </button>
                {isSuperAdmin && (
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
                        <span
                          className={a.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}
                        >
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={createEventOpen} onClose={() => setCreateEventOpen(false)} title="Nuevo evento">
        <form onSubmit={handleCreateEvent} className="space-y-4">
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
          <button type="submit" className="btn-primary w-full">
            Crear y activar evento
          </button>
        </form>
      </Modal>

      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={editingAssignment ? 'Editar turno' : 'Asignar personal'}
      >
        <form onSubmit={handleAssign} className="space-y-4">
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
          <button type="submit" className="btn-primary w-full">
            {editingAssignment ? 'Guardar turno' : 'Asignar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
