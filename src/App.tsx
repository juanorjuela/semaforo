import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import AdminDashboard from './components/AdminDashboard';
import { initializeSampleCards } from './config/firebase';
import './App.css';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initialize sample cards when the app starts
    initializeSampleCards();
  }, []);

  return (
    <div className="App">
      <nav className="bg-indigo-600 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">
                Semáforos de Igualdad
              </span>
            </div>
            <div>
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium"
              >
                {isAdmin ? 'Ir al Juego' : 'Administración'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {isAdmin ? <AdminDashboard /> : <GameBoard />}
      </main>
    </div>
  );
};

export default App; 