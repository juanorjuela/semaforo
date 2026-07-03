import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppUser, UserRole } from '../types';
import { getAllUsers, updateUserRole } from '../services/userService';
import { PageHeader, LoadingSpinner, Alert } from '../components/ui';
import { Navigate } from 'react-router-dom';

export default function UsersPage() {
  const { firebaseUser, appUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllUsers()
        .then(setUsers)
        .catch(() => setAlert({ type: 'error', message: 'Error al cargar usuarios.' }))
        .finally(() => setLoading(false));
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const handleRoleChange = async (uid: string, role: UserRole) => {
    if (!firebaseUser || !appUser) return;
    if (uid === firebaseUser.uid) {
      setAlert({ type: 'error', message: 'No puedes cambiar tu propio rol.' });
      return;
    }
    try {
      await updateUserRole(uid, role, firebaseUser.uid, appUser.email);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      setAlert({ type: 'success', message: 'Rol actualizado.' });
    } catch {
      setAlert({ type: 'error', message: 'Error al actualizar rol.' });
    }
  };

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Gestión de roles de administradores" />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.uid} className="card-padded flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.uid === firebaseUser?.uid && (
                  <span className="badge-blue mt-1">Tú</span>
                )}
              </div>
              <select
                className="input w-auto min-w-[160px]"
                value={user.role}
                onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                disabled={user.uid === firebaseUser?.uid}
              >
                <option value="super-admin">Super Admin</option>
                <option value="day-manager">Gestor de Día</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="card-padded mt-6 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2">Permisos por rol</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Super Admin:</strong> todo, incluyendo eliminar eventos y gestionar usuarios</li>
          <li><strong>Gestor de Día:</strong> personal, asignaciones, pagos y auditoría</li>
        </ul>
      </div>
    </div>
  );
}
