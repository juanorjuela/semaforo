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
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      const cardsCollection = collection(db, 'cards');
      const cardsSnapshot = await getDocs(cardsCollection);
      const fetchedCards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isFlipped: false,
        isAnswered: false
      })) as Card[];
      
      // Shuffle cards
      setCards(fetchedCards.sort(() => Math.random() - 0.5));
    };

    fetchCards();
  }, []);

  const checkAnswer = (card: Card) => {
    const fuse = new Fuse([card.answer], {
      threshold: 0.3,
      distance: 100
    });

    const result = fuse.search(currentAnswer);
    return result.length > 0;
  };

  const handleSubmit = () => {
    if (!gameState.currentCard) return;

    const isCorrect = checkAnswer(gameState.currentCard);
    if (isCorrect) {
      const updatedGameState = { ...gameState };
      switch (gameState.currentCard.color) {
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
      updatedGameState.answeredCards.push(gameState.currentCard);
      setGameState(updatedGameState);
    }

    // Flip card regardless of answer
    const cardIndex = cards.findIndex(c => c.id === gameState.currentCard.id);
    const updatedCards = [...cards];
    updatedCards[cardIndex].isFlipped = true;
    setCards(updatedCards);
  };

  const getHint = (answer: string) => {
    if (!answer) return '';
    return `${answer[0]}...${answer[answer.length - 1]}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              {/* Progress Counter */}
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p>Rojas: {gameState.redCards}/3</p>
                <p>Amarillas: {gameState.yellowCards}/2</p>
                <p>Verdes: {gameState.greenCards}/1</p>
              </div>

              {/* Card Display */}
              {gameState.currentCard && (
                <ReactCardFlip isFlipped={gameState.currentCard.isFlipped}>
                  <div className={`p-6 rounded-lg shadow-md bg-card-${gameState.currentCard.color}`}>
                    <h2 className="text-xl font-bold mb-4">{gameState.currentCard.question}</h2>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full p-2 rounded border"
                      placeholder="Tu respuesta..."
                    />
                    {showHint && (
                      <p className="text-sm mt-2">
                        Pista: {getHint(gameState.currentCard.answer)}
                      </p>
                    )}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => setShowHint(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Ver Pista
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Comprobar
                      </button>
                    </div>
                  </div>
                  <div className={`p-6 rounded-lg shadow-md bg-card-${gameState.currentCard.color}`}>
                    <h2 className="text-xl font-bold mb-4">Respuesta:</h2>
                    <p>{gameState.currentCard.answer}</p>
                  </div>
                </ReactCardFlip>
              )}

              {/* Win Screen */}
              {gameState.gameWon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div className="bg-white p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">¡Felicitaciones!</h2>
                    <p>Has completado el juego. ¡Eres un campeón de la igualdad!</p>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full p-2 rounded border mt-4"
                    />
                    <button className="bg-green-500 text-white px-4 py-2 rounded mt-4">
                      Guardar Puntuación
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard; 