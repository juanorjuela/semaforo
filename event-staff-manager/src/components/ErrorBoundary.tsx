import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error de aplicación:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
          <div className="card-padded max-w-md text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Algo salió mal</h1>
            <p className="text-sm text-gray-500 mb-6">
              Ocurrió un error inesperado. Recarga la página para continuar.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary w-full">
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
