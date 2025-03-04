import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
  isSpectator: boolean;
}

interface GameState {
  players: Player[];
  spectators: Player[];
  waitingList: Player[];
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
  const [isSpectator, setIsSpectator] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

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
      socket.emit('joinGame', { name: playerName, isSpectator });
      setIsConnected(true);
      setShowJoinDialog(false);
    }
  };

  const handleJoinAsPlayer = () => {
    socket.emit('joinAsPlayer');
  };

  const handleLeaveGame = () => {
    socket.emit('leaveGame');
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

  const getWaitingListPosition = (index: number): 'top' | 'bottom' | 'left' | 'right' => {
    const positions: ('top' | 'bottom' | 'left' | 'right')[] = ['bottom', 'right', 'top', 'left'];
    return positions[index % 4];
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
            <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)}>
              <DialogTitle>Rejoindre la partie</DialogTitle>
              <DialogContent>
                <TextField
                  label="Votre pseudo"
                  variant="outlined"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Button
                  variant={isSpectator ? "outlined" : "contained"}
                  onClick={() => setIsSpectator(!isSpectator)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {isSpectator ? "Mode Spectateur" : "Mode Joueur"}
                </Button>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowJoinDialog(false)}>Annuler</Button>
                <Button onClick={handleJoinGame} variant="contained">
                  Rejoindre
                </Button>
              </DialogActions>
            </Dialog>
            <Button
              variant="contained"
              onClick={() => setShowJoinDialog(true)}
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

            {/* Affichage des spectateurs */}
            {gameState?.spectators.map((spectator, index) => (
              <Box
                key={spectator.id}
                sx={{
                  position: 'absolute',
                  right: 20,
                  top: 20 + index * 40,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">{spectator.name} (Spectateur)</Typography>
              </Box>
            ))}

            {/* Affichage de la file d'attente */}
            {gameState?.waitingList.map((player, index) => (
              <Box
                key={player.id}
                sx={{
                  position: 'absolute',
                  ...(getWaitingListPosition(index) === 'bottom' && { bottom: 20 + index * 40, left: '50%', transform: 'translateX(-50%)' }),
                  ...(getWaitingListPosition(index) === 'top' && { top: 20 + index * 40, left: '50%', transform: 'translateX(-50%)' }),
                  ...(getWaitingListPosition(index) === 'left' && { left: 20, top: '50%', transform: 'translateY(-50%)' }),
                  ...(getWaitingListPosition(index) === 'right' && { right: 20, top: '50%', transform: 'translateY(-50%)' }),
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">{player.name} (En attente)</Typography>
              </Box>
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
              <>
                {isSpectator ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 2,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: 2,
                      borderRadius: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleJoinAsPlayer}
                      sx={{ backgroundColor: '#f7931a' }}
                    >
                      Rejoindre la partie
                    </Button>
                  </Box>
                ) : (
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
          </>
        )}
      </Paper>
    </Container>
  );
}

export default App; 