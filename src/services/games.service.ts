import { injectable } from 'tsyringe';
import { randomUUID } from 'crypto';

import { io } from '../lib/socket-instance';
import { getUserSocketId } from '../lib/socket-io';
import {
  GameInvitation,
  TicTacToeGame,
} from '../interfaces/tic-tac-toe-game.interface';
import { Board, Winner } from '../types/tic-tac-toe-game.type';

@injectable()
export class GamesService {
  private games: Map<string, TicTacToeGame> = new Map();
  private invitations: Map<string, GameInvitation> = new Map();
  private userGames: Map<string, string> = new Map(); // userId -> gameId

  createInvitation(from: string, to: string): GameInvitation | null {
    const invitation: GameInvitation = {
      id: randomUUID(),
      from,
      to,
      gameType: 'tic-tac-toe',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };

    this.invitations.set(invitation.id, invitation);

    // Auto-clear expired invitations
    setTimeout(
      () => {
        this.invitations.delete(invitation.id);
      },
      5 * 60 * 1000,
    );

    // Emit invitation to recipient
    const recipientSocketId = getUserSocketId(to);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('game:invitation', {
        invitation,
        sender: { _id: from }, // TODO: Fetch full user data here
      });

      //  Notify sender that invitation was sent
      const senderSocketId = getUserSocketId(from);
      if (senderSocketId) {
        io.to(senderSocketId).emit('game:invitation_sent', { invitation });
      }
      return invitation;
    }

    // If recipient is offline, don't create invitation
    this.invitations.delete(invitation.id);
    return null;
  }

  acceptInvitation(
    invitationId: string,
    acceptedBy: string,
  ): TicTacToeGame | null {
    const invitation = this.invitations.get(invitationId);

    if (!invitation || invitation.to !== acceptedBy) return null;

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      this.invitations.delete(invitationId);
      return null;
    }

    // Create the game
    const game = this.createGame(invitation.from, invitation.to);
    this.invitations.delete(invitationId);

    // Get socket IDs for both players
    const player1SocketId = getUserSocketId(invitation.from);
    const player2SocketId = getUserSocketId(invitation.to);

    // Join both players to game room
    if (player1SocketId) {
      io.sockets.sockets.get(player1SocketId)?.join(`game:${game.id}`);
    }
    if (player2SocketId) {
      io.sockets.sockets.get(player2SocketId)?.join(`game:${game.id}`);
    }

    // Emit game started event to both players
    io.to(`game:${game.id}`).emit('game:started', { game });

    return game;
  }

  declineInvitation(invitationId: string, declinedBy: string): boolean {
    const invitation = this.invitations.get(invitationId);

    if (!invitation || invitation.to !== declinedBy) return false;

    this.invitations.delete(invitationId);

    // Notify the sender
    const senderSocketId = getUserSocketId(invitation.from);
    if (senderSocketId) {
      io.to(senderSocketId).emit('game:invitation_declined', {
        declinedBy,
      });
    }

    return true;
  }

  makeMove(
    gameId: string,
    userId: string,
    position: number,
  ): TicTacToeGame | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Validate move
    if (game.status !== 'playing') return null;
    if (game.board[position] !== null) return null;

    // Check if it's the player's turn
    const playerSymbol =
      game.players.X === userId ? 'X' : game.players.O === userId ? 'O' : null;

    if (!playerSymbol || game.currentTurn !== playerSymbol) return null;

    // Make the move
    game.board[position] = playerSymbol;
    game.lastMoveAt = new Date();

    // Check for a winner
    const result = this.checkWinner(game.board);
    if (result.winner) {
      game.winner = result.winner;
      game.status = 'finished';
      game.winningCombination = result.combination;
    } else {
      // Switch turns
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    // Emit updated game state to all players in the room
    io.to(`game:${gameId}`).emit('game:update', { game });

    // If game is finished, schedule cleanup
    if (game.status === 'finished') {
      setTimeout(() => {
        io.in(`game:${gameId}`).socketsLeave(`game:${gameId}`);
        this.endGame(gameId);
      }, 5000); // Give players 5 seconds to see the result
    }

    return game;
  }

  resignGame(gameId: string, userId: string): TicTacToeGame | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'playing') return null;

    // End game
    const oponentSymbol = game.players.X === userId ? 'O' : 'X';
    game.winner = oponentSymbol;
    game.status = 'finished';

    // Emit updated game state
    io.to(`game:${gameId}`).emit('game:update', { game });

    // Schedule cleanup
    setTimeout(() => {
      io.in(`game:${gameId}`).socketsLeave(`game:${gameId}`);
      this.endGame(gameId);
    }, 5000);

    return game;
  }

  rejoinGame(gameId: string, userId: string): TicTacToeGame | null {
    const game = this.games.get(gameId);

    if (!game || (game.players.X !== userId && game.players.O !== userId)) {
      return null;
    }

    // Rejoin the socket to the game room
    const userSocketId = getUserSocketId(userId);
    if (userSocketId) {
      io.sockets.sockets.get(userSocketId)?.join(`game:${gameId}`);
    }

    return game;
  }

  handleUserDisconnect(userId: string): void {
    const game = this.getGameByUserId(userId);

    if (game && game.status === 'playing') {
      // Notify the other player
      io.to(`game:${game.id}`).emit('game:opponent_disconnected', {
        gameId: game.id,
      });
    }
  }

  getInvitation(invitationId: string): GameInvitation | undefined {
    return this.invitations.get(invitationId);
  }

  deleteInvitation(invitationId: string): void {
    this.invitations.delete(invitationId);
  }

  createGame(playerX: string, playerO: string): TicTacToeGame {
    // Remove any existing games for these players
    const existingGameX = this.userGames.get(playerX);
    const existingGameO = this.userGames.get(playerO);
    if (existingGameX) this.endGame(existingGameX);
    if (existingGameO) this.endGame(existingGameO);

    const game: TicTacToeGame = {
      id: randomUUID(),
      players: { X: playerX, O: playerO },
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'playing',
      winner: null,
      winningCombination: null,
      createdAt: new Date(),
      lastMoveAt: new Date(),
    };

    this.games.set(game.id, game);
    this.userGames.set(playerX, game.id);
    this.userGames.set(playerO, game.id);

    return game;
  }

  getGame(gameId: string): TicTacToeGame | undefined {
    return this.games.get(gameId);
  }

  getGameByUserId(userId: string): TicTacToeGame | undefined {
    const gameId = this.userGames.get(userId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  endGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      // Remove user mappings
      this.userGames.delete(game.players.X);
      this.userGames.delete(game.players.O);

      // Keep game in memory for a while for reconnection possibilities
      setTimeout(
        () => {
          this.games.delete(gameId);
        },
        30 * 60 * 1000,
      ); // 30 minutes
    }
  }

  private checkWinner(board: Board): {
    winner: Winner;
    combination: number[] | null;
  } {
    const winningCombinations = [
      // Rows
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // Columns
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // Diagonals
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], combination };
      }
    }

    // Check for draw
    if (board.every((cell) => cell !== null)) {
      return { winner: 'draw', combination: null };
    }

    return { winner: null, combination: null };
  }
}
