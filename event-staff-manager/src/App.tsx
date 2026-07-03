import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isFirebaseConfigured } from './config/firebase';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import EventPage from './pages/EventPage';
import StaffPage from './pages/StaffPage';
import PayrollPage from './pages/PayrollPage';
import AuditPage from './pages/AuditPage';
import UsersPage from './pages/UsersPage';
import ConfigErrorPage from './pages/ConfigErrorPage';
import { LoadingSpinner } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProfileErrorScreen() {
  const { profileError, retryProfile, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card-padded max-w-md w-full text-center">
        <p className="text-4xl mb-4">🔐</p>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Error de acceso</h1>
        <p className="text-sm text-gray-500 mb-6">{profileError}</p>
        <div className="flex flex-col gap-2">
          <button onClick={retryProfile} className="btn-primary w-full">
            Reintentar
          </button>
          <button onClick={signOut} className="btn-secondary w-full">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading, profileError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (profileError || !appUser) {
    return <ProfileErrorScreen />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EventPage />} />
        <Route path="personal" element={<StaffPage />} />
        <Route path="nomina" element={<PayrollPage />} />
        <Route path="auditoria" element={<AuditPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  if (!isFirebaseConfigured()) {
    return <ConfigErrorPage />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
