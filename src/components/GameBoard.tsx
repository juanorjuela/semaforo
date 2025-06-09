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
        
        // Sort cards by difficulty
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
      <div className="container-card">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="container-card">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-card">
      <div className="game-container">
        {/* Progress Tracker */}
        <div className="progress-container">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="progress-label">Rojas</span>
              <div className="progress-dots">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`red-${i}`}
                    className={`progress-dot ${
                      i < gameState.redCards ? 'progress-dot-red' : 'progress-dot-empty'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="progress-label">Amarillas</span>
              <div className="progress-dots">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={`yellow-${i}`}
                    className={`progress-dot ${
                      i < gameState.yellowCards ? 'progress-dot-yellow' : 'progress-dot-empty'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="progress-label">Verdes</span>
              <div className="progress-dots">
                <div
                  className={`progress-dot ${
                    gameState.greenCards > 0 ? 'progress-dot-green' : 'progress-dot-empty'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Display */}
        <div className="mt-8">
          <ReactCardFlip isFlipped={currentCard.isFlipped}>
            <div className={`card card-${currentCard.color}`}>
              <h2 className="card-question">{currentCard.question}</h2>
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="input-field"
                placeholder="Tu respuesta..."
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {showHint && (
                <p className="hint-text">
                  Pista: {getHint(currentCard.answer)}
                </p>
              )}
              <div className="button-container">
                <button
                  onClick={() => setShowHint(true)}
                  className="button-primary"
                  disabled={showHint}
                >
                  Ver Pista
                </button>
                <button
                  onClick={handleSubmit}
                  className="button-success"
                >
                  Comprobar
                </button>
              </div>
            </div>

            <div className={`card card-${currentCard.color}`}>
              <h2 className="card-question">Respuesta:</h2>
              <p className="card-answer">{currentCard.answer}</p>
              <button
                onClick={handleNextCard}
                className="button-primary w-full"
              >
                Siguiente Pregunta
              </button>
            </div>
          </ReactCardFlip>
        </div>
      </div>

      {/* Win Screen */}
      {gameState.gameWon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">¡Felicitaciones!</h2>
            <p className="mb-6 text-gray-600">
              Has completado el juego. ¡Eres un campeón de la igualdad!
            </p>
            <input
              type="text"
              placeholder="Tu nombre"
              className="input-field"
            />
            <button className="button-success w-full">
              Guardar Puntuación
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameBoard; 