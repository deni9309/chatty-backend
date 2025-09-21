import { Board, GameStatus, GameType, Player, Winner } from '../types/tic-tac-toe-game.type';

export interface TicTacToeGame {
  id: string;
  players: {
    X: string; // userId
    O: string; // userId
  };
  board: Board;
  currentTurn: Player;
  status: GameStatus;
  winner: Winner;
  winningCombination: number[] | null;
  createdAt: Date;
  lastMoveAt: Date;
}

export interface GameInvitation {
  id: string;
  from: string; // sender userId
  to: string; // receiver userId
  gameType: GameType;
  createdAt: Date;
  expiresAt: Date;
}
