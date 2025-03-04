import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid } from '@mui/material';
import { io } from 'socket.io-client';
import BitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import Player from './components/Player';
import GameActions from './components/GameActions';
import Card from './components/Card';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

interface CryptoPrices {
  bitcoin: { usd: number };
  ethereum: { usd: number };
  solana: { usd: number };
}

interface Player {
  id: string;
  name: string;
  chips: number;
  cards: Array<{ value: string; suit: string }>;
  isActive: boolean;
}

interface GameState {
  players: Player[];
  pot: number;
  currentBet: number;
  communityCards: Array<{ value: string; suit: string }>;
  currentPlayer: number;
  gamePhase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  minRaise: number;
}

function App() {
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connecté au serveur');
    });

    socket.on('cryptoPrices', (prices: CryptoPrices) => {
      setCryptoPrices(prices);
    });

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    socket.on('playerId', (id: string) => {
      setPlayerId(id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinGame = () => {
    if (playerName.trim()) {
      socket.emit('joinGame', playerName);
      setIsConnected(true);
    }
  };

  const handleFold = () => {
    socket.emit('fold');
  };

  const handleCall = () => {
    socket.emit('call');
  };

  const handleRaise = (amount: number) => {
    socket.emit('raise', amount);
  };

  const getPlayerPosition = (index: number): 'top' | 'bottom' | 'left' | 'right' => {
    if (gameState && gameState.players.length <= 4) {
      const positions: ('top' | 'bottom' | 'left' | 'right')[] = ['bottom', 'right', 'top', 'left'];
      return positions[index] || 'bottom';
    }
    return 'bottom';
  };

  return (
    <Container maxWidth="lg">
      {/* Bannière des prix crypto */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#1a1a1a', color: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center">
              <BitcoinIcon sx={{ mr: 1, color: '#f7931a' }} />
              <Typography>
                BTC: ${cryptoPrices?.bitcoin.usd.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography>
              ETH: ${cryptoPrices?.ethereum.usd.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography>
              SOL: ${cryptoPrices?.solana.usd.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table de poker */}
      <Paper sx={{ p: 4, backgroundColor: '#2e7d32', position: 'relative', minHeight: '600px' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BitcoinIcon sx={{ fontSize: 150, color: '#f7931a' }} />
        </Box>

        {!isConnected ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h4" color="white" gutterBottom>
              Bienvenue sur WEN Poker
            </Typography>
            <TextField
              label="Votre pseudo"
              variant="outlined"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleJoinGame}
              sx={{ backgroundColor: '#f7931a' }}
            >
              Rejoindre la table
            </Button>
          </Box>
        ) : (
          <>
            {/* Affichage des joueurs */}
            {gameState?.players.map((player, index) => (
              <Player
                key={player.id}
                name={player.name}
                chips={player.chips}
                cards={player.cards}
                isActive={player.isActive}
                position={getPlayerPosition(index)}
                isCurrentPlayer={player.id === playerId && gameState.currentPlayer === index}
              />
            ))}

            {/* Cartes communes */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                gap: 1,
                zIndex: 1,
              }}
            >
              {gameState?.communityCards.map((card, index) => (
                <Card key={index} value={card.value} suit={card.suit} />
              ))}
            </Box>

            {/* Pot */}
            <Typography
              variant="h6"
              sx={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: 1,
                borderRadius: 1,
                zIndex: 2,
              }}
            >
              Pot: {gameState?.pot} WEN
            </Typography>

            {/* Actions du jeu */}
            {gameState && playerId && (
              <GameActions
                currentBet={gameState.currentBet}
                minRaise={gameState.minRaise}
                playerChips={gameState.players.find(p => p.id === playerId)?.chips || 0}
                onFold={handleFold}
                onCall={handleCall}
                onRaise={handleRaise}
                isCurrentPlayer={gameState.players.findIndex(p => p.id === playerId) === gameState.currentPlayer}
              />
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default App; 