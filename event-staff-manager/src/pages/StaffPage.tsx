import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StaffMember } from '../types';
import {
  getActiveStaff,
  getAllStaff,
  createStaff,
  updateStaff,
  archiveStaff,
} from '../services/staffService';
import { PageHeader, EmptyState, LoadingSpinner, Alert, Modal } from '../components/ui';
import { formatCop, parseCopInput } from '../utils/currency';
import { PlusIcon, PencilIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  defaultHourlyWage: '',
  healthInsuranceProvider: '',
  healthInsurancePolicy: '',
  backgroundNotes: '',
};

export default function StaffPage() {
  const { firebaseUser, appUser } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = showArchived ? await getAllStaff() : await getActiveStaff();
      setStaff(showArchived ? data : data.filter((s) => !s.archived));
    } catch {
      setAlert({ type: 'error', message: 'Error al cargar el personal.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [showArchived]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      defaultHourlyWage: member.defaultHourlyWage?.toString() || '',
      healthInsuranceProvider: member.healthInsuranceProvider || '',
      healthInsurancePolicy: member.healthInsurancePolicy || '',
      backgroundNotes: member.backgroundNotes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !appUser) return;

    const wage = parseCopInput(form.defaultHourlyWage);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      defaultHourlyWage: wage,
      healthInsuranceProvider: form.healthInsuranceProvider.trim() || undefined,
      healthInsurancePolicy: form.healthInsurancePolicy.trim() || undefined,
      backgroundNotes: form.backgroundNotes.trim() || undefined,
    };

    try {
      if (editing) {
        await updateStaff(editing.id, payload, firebaseUser.uid, appUser.email);
        setAlert({ type: 'success', message: 'Personal actualizado.' });
      } else {
        await createStaff(payload, firebaseUser.uid, appUser.email);
        setAlert({ type: 'success', message: 'Personal agregado.' });
      }
      setModalOpen(false);
      load();
    } catch {
      setAlert({ type: 'error', message: 'Error al guardar.' });
    }
  };

  const handleArchive = async (member: StaffMember) => {
    if (!firebaseUser || !appUser) return;
    if (!window.confirm(`¿Archivar a ${member.name}?`)) return;
    try {
      await archiveStaff(member.id, member.name, firebaseUser.uid, appUser.email);
      setAlert({ type: 'success', message: `${member.name} archivado.` });
      load();
    } catch {
      setAlert({ type: 'error', message: 'Error al archivar.' });
    }
  };

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Personal"
        subtitle="Directorio de trabajadores"
        action={
          <button onClick={openCreate} className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            Agregar
          </button>
        }
      />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="btn-secondary whitespace-nowrap"
        >
          {showArchived ? 'Solo activos' : 'Ver archivados'}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          message="No hay personal registrado."
          action={
            <button onClick={openCreate} className="btn-primary">
              Agregar primer miembro
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => (
            <div key={member.id} className="card-padded">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    {member.archived && <span className="badge-gray">Archivado</span>}
                  </div>
                  {member.phone && <p className="text-sm text-gray-500 mt-0.5">{member.phone}</p>}
                  {member.defaultHourlyWage != null && (
                    <p className="text-sm text-primary-600 font-medium mt-1">
                      {formatCop(member.defaultHourlyWage)}/hora
                    </p>
                  )}
                </div>
                {!member.archived && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(member)} className="btn-ghost btn-sm">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleArchive(member)} className="btn-ghost btn-sm text-red-500">
                      <ArchiveBoxIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar personal' : 'Nuevo personal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono</label>
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Correo</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Tarifa por hora (COP)</label>
            <input
              className="input"
              inputMode="numeric"
              placeholder="ej. 15000"
              value={form.defaultHourlyWage}
              onChange={(e) => setForm({ ...form, defaultHourlyWage: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Aseguradora de salud</label>
              <input
                className="input"
                value={form.healthInsuranceProvider}
                onChange={(e) => setForm({ ...form, healthInsuranceProvider: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Nº de póliza</label>
              <input
                className="input"
                value={form.healthInsurancePolicy}
                onChange={(e) => setForm({ ...form, healthInsurancePolicy: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Notas / antecedentes</label>
            <textarea
              className="input min-h-[80px]"
              value={form.backgroundNotes}
              onChange={(e) => setForm({ ...form, backgroundNotes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            {editing ? 'Guardar cambios' : 'Agregar personal'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
