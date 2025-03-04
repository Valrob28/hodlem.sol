import { Server, Socket } from 'socket.io';

interface Card {
  value: string;
  suit: string;
}

interface Player {
  id: string;
  name: string;
  chips: number;
  cards: Card[];
  isActive: boolean;
  isSpectator: boolean;
}

interface GameState {
  players: Player[];
  spectators: Player[];
  waitingList: Player[];
  pot: number;
  currentBet: number;
  communityCards: Card[];
  currentPlayer: number;
  gamePhase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  minRaise: number;
}

export class PokerGame {
  private gameState: GameState;
  private deck: Card[];
  private io: Server;
  private readonly SMALL_BLIND = 50;
  private readonly BIG_BLIND = 100;
  private readonly INITIAL_CHIPS = 10000;
  private readonly MAX_PLAYERS = 10;

  constructor(io: Server) {
    this.io = io;
    this.gameState = {
      players: [],
      spectators: [],
      waitingList: [],
      pot: 0,
      currentBet: 0,
      communityCards: [],
      currentPlayer: 0,
      gamePhase: 'preflop',
      minRaise: this.BIG_BLIND,
    };
    this.deck = this.createDeck();
  }

  private createDeck(): Card[] {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({ value, suit });
      }
    }

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  public addPlayer(socket: Socket, name: string, isSpectator: boolean = false): void {
    const newPlayer: Player = {
      id: socket.id,
      name,
      chips: this.INITIAL_CHIPS,
      cards: [],
      isActive: true,
      isSpectator: isSpectator,
    };

    if (isSpectator) {
      this.gameState.spectators.push(newPlayer);
    } else if (this.gameState.players.length >= this.MAX_PLAYERS) {
      this.gameState.waitingList.push(newPlayer);
    } else {
      this.gameState.players.push(newPlayer);
    }

    socket.emit('playerId', socket.id);
    this.broadcastGameState();

    if (this.gameState.players.length >= 2) {
      this.startNewHand();
    }
  }

  public removePlayer(socketId: string): void {
    this.gameState.players = this.gameState.players.filter(p => p.id !== socketId);
    this.gameState.spectators = this.gameState.spectators.filter(p => p.id !== socketId);
    this.gameState.waitingList = this.gameState.waitingList.filter(p => p.id !== socketId);
    this.broadcastGameState();
  }

  public joinGame(socketId: string): void {
    const spectator = this.gameState.spectators.find(p => p.id === socketId);
    if (!spectator) return;

    if (this.gameState.players.length >= this.MAX_PLAYERS) {
      this.gameState.waitingList.push(spectator);
    } else {
      this.gameState.players.push(spectator);
    }
    this.gameState.spectators = this.gameState.spectators.filter(p => p.id !== socketId);
    this.broadcastGameState();
  }

  public leaveGame(socketId: string): void {
    const player = this.gameState.players.find(p => p.id === socketId);
    if (!player) return;

    this.gameState.spectators.push(player);
    this.gameState.players = this.gameState.players.filter(p => p.id !== socketId);
    this.broadcastGameState();
  }

  private checkWaitingList(): void {
    while (this.gameState.players.length < this.MAX_PLAYERS && this.gameState.waitingList.length > 0) {
      const nextPlayer = this.gameState.waitingList.shift();
      if (nextPlayer) {
        this.gameState.players.push(nextPlayer);
      }
    }
    this.broadcastGameState();
  }

  private startNewHand(): void {
    this.deck = this.createDeck();
    this.gameState.pot = 0;
    this.gameState.currentBet = 0;
    this.gameState.communityCards = [];
    this.gameState.gamePhase = 'preflop';
    this.gameState.minRaise = this.BIG_BLIND;

    // Distribution des cartes
    this.gameState.players.forEach(player => {
      player.cards = [this.deck.pop()!, this.deck.pop()!];
      player.isActive = true;
    });

    // Poste des blinds
    const smallBlindIndex = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
    const bigBlindIndex = (this.gameState.currentPlayer + 2) % this.gameState.players.length;

    this.gameState.players[smallBlindIndex].chips -= this.SMALL_BLIND;
    this.gameState.players[bigBlindIndex].chips -= this.BIG_BLIND;
    this.gameState.pot = this.SMALL_BLIND + this.BIG_BLIND;
    this.gameState.currentBet = this.BIG_BLIND;

    this.checkWaitingList();
    this.broadcastGameState();
  }

  public handleFold(socketId: string): void {
    const playerIndex = this.gameState.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) return;

    this.gameState.players[playerIndex].isActive = false;
    this.checkEndOfRound();
  }

  public handleCall(socketId: string): void {
    const playerIndex = this.gameState.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) return;

    const player = this.gameState.players[playerIndex];
    const callAmount = this.gameState.currentBet;
    player.chips -= callAmount;
    this.gameState.pot += callAmount;

    this.nextPlayer();
  }

  public handleRaise(socketId: string, amount: number): void {
    const playerIndex = this.gameState.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) return;

    const player = this.gameState.players[playerIndex];
    if (amount < this.gameState.minRaise || amount > player.chips) return;

    player.chips -= amount;
    this.gameState.pot += amount;
    this.gameState.currentBet = amount;
    this.gameState.minRaise = amount * 2;

    this.nextPlayer();
  }

  private nextPlayer(): void {
    let nextIndex = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
    while (!this.gameState.players[nextIndex].isActive) {
      nextIndex = (nextIndex + 1) % this.gameState.players.length;
    }
    this.gameState.currentPlayer = nextIndex;
    this.broadcastGameState();
  }

  private checkEndOfRound(): void {
    const activePlayers = this.gameState.players.filter(p => p.isActive);
    if (activePlayers.length === 1) {
      // Un seul joueur actif, il gagne le pot
      activePlayers[0].chips += this.gameState.pot;
      this.startNewHand();
    } else {
      this.nextPlayer();
    }
  }

  private broadcastGameState(): void {
    this.io.emit('gameState', this.gameState);
  }
} 