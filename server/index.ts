import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { PokerGame } from './game';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST']
}));

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  console.log('Serving static files from:', clientBuildPath);
  
  app.use(express.static(clientBuildPath));
  
  // Gérer toutes les autres routes en renvoyant index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

const game = new PokerGame(io);

interface Player {
  id: string;
  name: string;
  chips: number;
  cards: string[];
  isActive: boolean;
}

interface GameState {
  players: Player[];
  pot: number;
  currentBet: number;
  communityCards: string[];
  currentPlayer: number;
  gamePhase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
}

const gameState: GameState = {
  players: [],
  pot: 0,
  currentBet: 0,
  communityCards: [],
  currentPlayer: 0,
  gamePhase: 'preflop'
};

const MAX_PLAYERS = 10;
const INITIAL_CHIPS = 10000;

// Fonction pour obtenir le prix des cryptomonnaies avec gestion des erreurs
async function getCryptoPrices() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd', {
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.log('Rate limit atteint, attente de 60 secondes...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return getCryptoPrices(); // Réessayer après l'attente
    }
    console.error('Erreur lors de la récupération des prix:', error);
    return null;
  }
}

// Mise à jour des prix toutes les 5 minutes avec gestion des erreurs
setInterval(async () => {
  try {
    const prices = await getCryptoPrices();
    if (prices) {
      io.emit('cryptoPrices', prices);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des prix:', error);
  }
}, 300000);

io.on('connection', (socket) => {
  console.log('Un joueur s\'est connecté');

  socket.on('joinGame', (data: { name: string; isSpectator: boolean }) => {
    game.addPlayer(socket, data.name, data.isSpectator);
  });

  socket.on('joinAsPlayer', () => {
    game.joinGame(socket.id);
  });

  socket.on('leaveGame', () => {
    game.leaveGame(socket.id);
  });

  socket.on('fold', () => {
    game.handleFold(socket.id);
  });

  socket.on('call', () => {
    game.handleCall(socket.id);
  });

  socket.on('raise', (amount: number) => {
    game.handleRaise(socket.id, amount);
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
  });
});

function startNewHand() {
  // Logique de distribution des cartes et début de partie
  gameState.pot = 0;
  gameState.currentBet = 0;
  gameState.communityCards = [];
  gameState.gamePhase = 'preflop';
  
  // Distribution des cartes (à implémenter)
  
  io.emit('gameState', gameState);
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 