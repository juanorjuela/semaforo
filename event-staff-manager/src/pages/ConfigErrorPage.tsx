import React from 'react';
import { getMissingFirebaseEnvVars } from '../config/env';

export default function ConfigErrorPage() {
  const missing = getMissingFirebaseEnvVars();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card-padded max-w-lg w-full">
        <p className="text-4xl mb-4 text-center">🔧</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Configuración de Firebase requerida
        </h1>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Copia <code className="bg-gray-100 px-1 rounded">.env.example</code> a{' '}
          <code className="bg-gray-100 px-1 rounded">.env</code> y completa las variables:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 mb-6 bg-gray-50 rounded-lg p-4 font-mono text-xs">
          {missing.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        <pre className="text-xs bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
{`cd event-staff-manager
cp .env.example .env
npm start`}
        </pre>
      </div>
    </div>
  );
}
