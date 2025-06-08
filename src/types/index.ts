export type CardColor = 'red' | 'yellow' | 'green';

export interface Card {
  id: string;
  question: string;
  answer: string;
  color: CardColor;
  isFlipped: boolean;
  isAnswered: boolean;
}

export interface GameState {
  redCards: number;
  yellowCards: number;
  greenCards: number;
  currentCard?: Card;
  answeredCards: Card[];
  gameWon: boolean;
}

export interface LeaderboardEntry {
  name: string;
  timestamp: number;
} 