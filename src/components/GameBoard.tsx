import React, { useState, useEffect } from 'react';
import ReactCardFlip from 'react-card-flip';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Card, GameState } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    redCards: 0,
    yellowCards: 0,
    greenCards: 0,
    answeredCards: [],
    gameWon: false
  });

  const [cards, setCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const cardsCollection = collection(db, 'cards');
        const cardsSnapshot = await getDocs(cardsCollection);
        const fetchedCards = cardsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isFlipped: false,
          isAnswered: false
        })) as Card[];
        
        // Sort cards by difficulty (red -> yellow -> green)
        const sortedCards = fetchedCards.sort((a, b) => {
          const order = { red: 0, yellow: 1, green: 2 };
          return order[a.color] - order[b.color];
        });
        
        setCards(sortedCards);
        setCurrentCard(sortedCards[0]);
      } catch (error) {
        console.error('Error fetching cards:', error);
        setError('Error loading cards. Please try again later.');
      }
    };

    fetchCards();
  }, []);

  const checkAnswer = (answer: string, correctAnswer: string) => {
    const fuse = new Fuse([correctAnswer], {
      threshold: 0.3,
      distance: 100
    });

    const result = fuse.search(answer.toLowerCase());
    return result.length > 0;
  };

  const canAccessCard = (color: string): boolean => {
    switch (color) {
      case 'red':
        return true;
      case 'yellow':
        return gameState.redCards >= 3;
      case 'green':
        return gameState.redCards >= 3 && gameState.yellowCards >= 2;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!currentCard) return;

    if (!canAccessCard(currentCard.color)) {
      setError(`Complete las tarjetas anteriores primero`);
      return;
    }

    const isCorrect = checkAnswer(currentAnswer.trim(), currentCard.answer);
    if (isCorrect) {
      const updatedGameState = { ...gameState };
      switch (currentCard.color) {
        case 'red':
          updatedGameState.redCards++;
          break;
        case 'yellow':
          updatedGameState.yellowCards++;
          break;
        case 'green':
          updatedGameState.greenCards++;
          updatedGameState.gameWon = true;
          break;
      }
      updatedGameState.answeredCards.push(currentCard);
      setGameState(updatedGameState);
      setError(null);
    } else {
      setError('Respuesta incorrecta. Inténtalo de nuevo.');
    }

    setCurrentCard({
      ...currentCard,
      isFlipped: true,
      isAnswered: isCorrect
    });
  };

  const getHint = (answer: string) => {
    if (!answer) return '';
    const words = answer.split(' ');
    return words.map(word => `${word[0]}...${word[word.length - 1]}`).join(' ');
  };

  const handleNextCard = () => {
    const nextCard = cards.find(c => !c.isAnswered && canAccessCard(c.color));
    if (nextCard) {
      setCurrentCard({...nextCard, isFlipped: false});
      setCurrentAnswer('');
      setShowHint(false);
      setError(null);
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              {/* Progress Counter */}
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center">
                  <span>Rojas:</span>
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < gameState.redCards ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Amarillas:</span>
                  <div className="flex space-x-1">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < gameState.yellowCards ? 'bg-yellow-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Verdes:</span>
                  <div className="flex space-x-1">
                    {[...Array(1)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < gameState.greenCards ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Display */}
              <div className="py-8">
                <ReactCardFlip isFlipped={currentCard.isFlipped}>
                  <div className={`card-front card-${currentCard.color}`}>
                    <h2 className="text-xl font-bold mb-4">{currentCard.question}</h2>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="input-field"
                      placeholder="Tu respuesta..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    {showHint && (
                      <p className="text-sm mt-2 text-gray-600">
                        Pista: {getHint(currentCard.answer)}
                      </p>
                    )}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => setShowHint(true)}
                        className="game-button-primary"
                        disabled={showHint}
                      >
                        Ver Pista
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="game-button-success"
                      >
                        Comprobar
                      </button>
                    </div>
                  </div>
                  <div className={`card-back card-${currentCard.color}`}>
                    <h2 className="text-xl font-bold mb-4">Respuesta:</h2>
                    <p className="mb-4">{currentCard.answer}</p>
                    <button
                      onClick={handleNextCard}
                      className="game-button-primary w-full"
                    >
                      Siguiente Pregunta
                    </button>
                  </div>
                </ReactCardFlip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Screen */}
      {gameState.gameWon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">¡Felicitaciones!</h2>
            <p className="mb-4">Has completado el juego. ¡Eres un campeón de la igualdad!</p>
            <input
              type="text"
              placeholder="Tu nombre"
              className="input-field mb-4"
            />
            <button className="game-button-success w-full">
              Guardar Puntuación
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameBoard; 