import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { PokerGame } from './game';
import fs from 'fs';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('Starting server with configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('CLIENT_URL:', CLIENT_URL);
console.log('Current directory:', __dirname);
console.log('Working directory:', process.cwd());

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST']
}));

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode');
  
  // Essayer différents chemins possibles
  const possiblePaths = [
    path.join(process.cwd(), 'client', 'build'),
    path.join(process.cwd(), 'src', 'client', 'build'),
    path.join(__dirname, 'client', 'build'),
    path.join(__dirname, '../client', 'build'),
    path.join(__dirname, '../../client', 'build')
  ];

  console.log('Trying possible build paths:', possiblePaths);
  
  let clientBuildPath = '';
  
  // Trouver le premier chemin qui existe
  for (const buildPath of possiblePaths) {
    try {
      fs.accessSync(buildPath);
      clientBuildPath = buildPath;
      console.log('Found build directory at:', clientBuildPath);
      console.log('Build directory contents:', fs.readdirSync(clientBuildPath));
      break;
    } catch (err) {
      console.log('Path not found:', buildPath);
    }
  }

  if (!clientBuildPath) {
    console.error('No build directory found in any of the expected locations');
    console.error('Available directories in current directory:', fs.readdirSync(__dirname));
    console.error('Available directories in working directory:', fs.readdirSync(process.cwd()));
  } else {
    console.log('Serving static files from:', clientBuildPath);
    app.use(express.static(clientBuildPath));
    
    // Gérer toutes les autres routes en renvoyant index.html
    app.get('*', (req, res) => {
      console.log('Request received for:', req.path);
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }
}

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

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

// Démarrage du serveur
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`CLIENT_URL: ${CLIENT_URL}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Working directory: ${process.cwd()}`);
}); 