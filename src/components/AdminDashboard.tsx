import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardColor } from '../types';

const AdminDashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Card[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answer: '',
    color: 'red' as CardColor
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const questionsCollection = collection(db, 'cards');
    const questionsSnapshot = await getDocs(questionsCollection);
    const questionsList = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isFlipped: false,
      isAnswered: false
    })) as Card[];
    setQuestions(questionsList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'cards'), {
        question: newQuestion.question,
        answer: newQuestion.answer,
        color: newQuestion.color
      });
      setNewQuestion({
        question: '',
        answer: '',
        color: 'red'
      });
      fetchQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cards', id));
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-4">Panel de Administración</h2>
                
                {/* Add Question Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pregunta
                    </label>
                    <input
                      type="text"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Respuesta
                    </label>
                    <input
                      type="text"
                      value={newQuestion.answer}
                      onChange={(e) => setNewQuestion({...newQuestion, answer: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <select
                      value={newQuestion.color}
                      onChange={(e) => setNewQuestion({...newQuestion, color: e.target.value as CardColor})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="red">Rojo</option>
                      <option value="yellow">Amarillo</option>
                      <option value="green">Verde</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Agregar Pregunta
                  </button>
                </form>

                {/* Questions List */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900">Preguntas Existentes</h3>
                  <div className="mt-4 space-y-4">
                    {questions.map((question) => (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg bg-card-${question.color} flex justify-between items-center`}
                      >
                        <div>
                          <p className="font-medium">{question.question}</p>
                          <p className="text-sm text-gray-600">{question.answer}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 