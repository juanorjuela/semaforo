import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  UsersIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Evento', icon: CalendarDaysIcon, end: true },
  { to: '/personal', label: 'Personal', icon: UsersIcon },
  { to: '/nomina', label: 'Nómina', icon: BanknotesIcon },
  { to: '/auditoria', label: 'Auditoría', icon: ClipboardDocumentListIcon },
];

export default function Layout() {
  const { appUser, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-0">
      <header className="bg-primary-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-200 font-medium">Gestión de Personal</p>
            <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {appUser?.displayName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-primary-500/30 text-white text-[10px] hidden sm:inline">
              {appUser?.role === 'super-admin' ? 'Super Admin' : 'Gestor de Día'}
            </span>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-primary-700 transition-colors"
              aria-label="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <nav className="hidden sm:block bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
          {isSuperAdmin && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Usuarios
            </NavLink>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        <Outlet />
      </main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-40">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 min-w-[64px] text-[10px] font-medium ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-0.5" />
              {item.label}
            </NavLink>
          ))}
          {isSuperAdmin && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 min-w-[64px] text-[10px] font-medium ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`
              }
            >
              <Cog6ToothIcon className="w-6 h-6 mb-0.5" />
              Usuarios
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}
