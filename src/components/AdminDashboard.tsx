import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card } from '../types';

const AdminDashboard: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    color: 'red'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const cardsCollection = collection(db, 'cards');
      const cardsSnapshot = await getDocs(cardsCollection);
      const fetchedCards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Card[];
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setError('Error loading cards. Please try again later.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cardsCollection = collection(db, 'cards');
      await addDoc(cardsCollection, newCard);
      setNewCard({
        question: '',
        answer: '',
        color: 'red'
      });
      setSuccess('¡Tarjeta agregada exitosamente!');
      setTimeout(() => setSuccess(null), 3000);
      fetchCards();
    } catch (error) {
      console.error('Error adding card:', error);
      setError('Error al agregar la tarjeta. Por favor, intenta de nuevo.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      setSuccess('¡Tarjeta eliminada exitosamente!');
      setTimeout(() => setSuccess(null), 3000);
      fetchCards();
    } catch (error) {
      console.error('Error deleting card:', error);
      setError('Error al eliminar la tarjeta. Por favor, intenta de nuevo.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>
      
      {/* Add New Card Form */}
      <div className="admin-card">
        <h2>Agregar Nueva Tarjeta</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">
              Pregunta
            </label>
            <input
              type="text"
              value={newCard.question}
              onChange={(e) => setNewCard({...newCard, question: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Respuesta
            </label>
            <input
              type="text"
              value={newCard.answer}
              onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Color
            </label>
            <select
              value={newCard.color}
              onChange={(e) => setNewCard({...newCard, color: e.target.value})}
              className="input-field"
              required
            >
              <option value="red">Rojo</option>
              <option value="yellow">Amarillo</option>
              <option value="green">Verde</option>
            </select>
          </div>
          <button
            type="submit"
            className="button-success w-full"
          >
            Agregar Tarjeta
          </button>
        </form>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" role="alert">
          {success}
        </div>
      )}

      {/* Cards List */}
      <div className="admin-card">
        <h2>Tarjetas Existentes</h2>
        <div className="card-grid">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card card-${card.color} relative`}
            >
              <button
                onClick={() => handleDelete(card.id)}
                className="delete-button"
                aria-label="Delete card"
              >
                ×
              </button>
              <h3>Pregunta:</h3>
              <p className="mb-4">{card.question}</p>
              <h3>Respuesta:</h3>
              <p>{card.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 