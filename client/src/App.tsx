import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, useTheme, useMediaQuery } from '@mui/material';
import { io } from 'socket.io-client';
import { useIsMobile } from './hooks/useIsMobile';
import Card from './components/Card';
import Player from './components/Player';
import GameActions from './components/GameActions';
import CryptoBanner from './components/CryptoBanner';
import BitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

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

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(true);
  const isMobile = useIsMobile();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
      socket?.emit('joinGame', { name: playerName, isSpectator });
      setShowJoinDialog(false);
    }
  };

  const handleJoinAsPlayer = () => {
    socket?.emit('joinAsPlayer');
  };

  const handleLeaveGame = () => {
    socket?.emit('leaveGame');
  };

  const handleFold = () => {
    socket?.emit('fold');
  };

  const handleCall = () => {
    socket?.emit('call');
  };

  const handleRaise = (amount: number) => {
    socket?.emit('raise', amount);
  };

  const getPlayerPosition = (index: number) => {
    if (!gameState) return { top: '0%', left: '0%' };
    const totalPlayers = gameState.players.length;
    const angle = (index * 360) / totalPlayers;
    const radius = isMobile ? 120 : 200;
    const top = 50 + radius * Math.sin((angle * Math.PI) / 180);
    const left = 50 + radius * Math.cos((angle * Math.PI) / 180);
    return { top: `${top}%`, left: `${left}%` };
  };

  const getWaitingListPosition = (index: number) => {
    const totalWaiting = gameState?.waitingList.length || 0;
    const angle = (index * 360) / totalWaiting;
    const radius = isMobile ? 80 : 150;
    const top = 50 + radius * Math.sin((angle * Math.PI) / 180);
    const left = 50 + radius * Math.cos((angle * Math.PI) / 180);
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <Container maxWidth={false} sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <CryptoBanner prices={cryptoPrices} />
      
      <Box sx={{ 
        position: 'relative', 
        height: 'calc(100vh - 40px)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {gameState && (
          <>
            {/* Joueurs actifs */}
            {gameState.players.map((player, index) => (
              <Box
                key={player.id}
                sx={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  ...getPlayerPosition(index),
                  width: isMobile ? '120px' : '200px',
                  zIndex: 1
                }}
              >
                <Player
                  player={player}
                  isCurrentPlayer={gameState.currentPlayer === index}
                  isMobile={isMobile}
                />
              </Box>
            ))}

            {/* Spectateurs */}
            {gameState.spectators.map((player, index) => (
              <Box
                key={player.id}
                sx={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  ...getPlayerPosition(index + gameState.players.length),
                  width: isMobile ? '100px' : '150px',
                  zIndex: 0
                }}
              >
                <Player
                  player={player}
                  isSpectator={true}
                  isMobile={isMobile}
                />
              </Box>
            ))}

            {/* Liste d'attente */}
            {gameState.waitingList.map((player, index) => (
              <Box
                key={player.id}
                sx={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  ...getWaitingListPosition(index),
                  width: isMobile ? '80px' : '120px',
                  zIndex: 0
                }}
              >
                <Player
                  player={player}
                  isWaiting={true}
                  isMobile={isMobile}
                />
              </Box>
            ))}

            {/* Pot et actions */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: isMobile ? '10px' : '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              zIndex: 2
            }}>
              <Typography variant={isMobile ? "body2" : "h6"} color="white">
                Pot: {gameState.pot}
              </Typography>
              <GameActions
                onFold={handleFold}
                onCall={handleCall}
                onRaise={handleRaise}
                currentBet={gameState.currentBet}
                isMobile={isMobile}
              />
            </Box>
          </>
        )}

        {/* Dialog de connexion */}
        <Dialog 
          open={showJoinDialog} 
          onClose={() => {}} 
          PaperProps={{
            sx: {
              width: isMobile ? '90%' : '400px',
              maxWidth: '90%'
            }
          }}
        >
          <DialogTitle>Rejoindre la partie</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Votre nom"
              fullWidth
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant={isSpectator ? "outlined" : "contained"}
                onClick={() => setIsSpectator(false)}
                fullWidth
              >
                Jouer
              </Button>
              <Button
                variant={isSpectator ? "contained" : "outlined"}
                onClick={() => setIsSpectator(true)}
                fullWidth
              >
                Spectateur
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleJoinGame} variant="contained" fullWidth>
              Rejoindre
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default App; 