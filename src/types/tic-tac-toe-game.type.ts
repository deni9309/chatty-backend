export type Player = 'X' | 'O';
export type Board = (Player | null)[];
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Winner = Player | 'draw' | null;
export type GameType = 'tic-tac-toe' | 'other';
