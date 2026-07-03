import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, LoadingSpinner } from '../components/ui';

export default function LoginPage() {
  const { signInWithGoogle, firebaseUser, appUser, loading, profileError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!loading && firebaseUser && appUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      console.error(err);
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-600 to-primary-700">
      <div className="card-padded w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Ecoguardianas</h1>
        <p className="text-sm text-gray-500 mb-8">
          Gestión de personal, horarios y pagos para tus eventos
        </p>

        {(error || profileError) && (
          <Alert type="error" message={error || profileError || ''} onClose={() => setError(null)} />
        )}

        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="btn-primary w-full text-base"
        >
          {signingIn ? 'Conectando...' : 'Iniciar sesión con Google'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Acceso solo para administradores autorizados.
          <br />
          En iPhone: usa Safari o Chrome, sin modo privado.
        </p>
      </div>
    </div>
  );
}
