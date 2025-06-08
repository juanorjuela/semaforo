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
      setSuccess('Card added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchCards();
    } catch (error) {
      console.error('Error adding card:', error);
      setError('Error adding card. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      setSuccess('Card deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchCards();
    } catch (error) {
      console.error('Error deleting card:', error);
      setError('Error deleting card. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Add New Card Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Card</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={newCard.question}
              onChange={(e) => setNewCard({...newCard, question: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <input
              type="text"
              value={newCard.answer}
              onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select
              value={newCard.color}
              onChange={(e) => setNewCard({...newCard, color: e.target.value})}
              className="input-field"
              required
            >
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
            </select>
          </div>
          <button
            type="submit"
            className="game-button-success w-full"
          >
            Add Card
          </button>
        </form>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}

      {/* Cards List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`card-${card.color} p-4 rounded-lg relative`}
            >
              <button
                onClick={() => handleDelete(card.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
              <h3 className="font-semibold mb-2">Question:</h3>
              <p className="mb-4">{card.question}</p>
              <h3 className="font-semibold mb-2">Answer:</h3>
              <p>{card.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 