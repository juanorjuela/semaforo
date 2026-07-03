import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../components/ui';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-600 to-primary-700">
      <div className="card-padded w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎪</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Personal</h1>
        <p className="text-sm text-gray-500 mb-8">
          Administra el personal, horarios y pagos de tus eventos
        </p>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary w-full text-base"
        >
          {loading ? 'Conectando...' : 'Iniciar sesión con Google'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Acceso solo para administradores autorizados
        </p>
      </div>
    </div>
  );
}
