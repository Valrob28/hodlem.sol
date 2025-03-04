import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface GameActionsProps {
  currentBet: number;
  minRaise: number;
  playerChips: number;
  onFold: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  isCurrentPlayer: boolean;
}

const GameActions: React.FC<GameActionsProps> = ({
  currentBet,
  minRaise,
  playerChips,
  onFold,
  onCall,
  onRaise,
  isCurrentPlayer,
}) => {
  const callAmount = currentBet;
  const canRaise = playerChips > minRaise;

  if (!isCurrentPlayer) {
    return null;
  }

  return (
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
        color="error"
        onClick={onFold}
        sx={{ backgroundColor: '#d32f2f' }}
      >
        Se coucher
      </Button>
      <Button
        variant="contained"
        onClick={onCall}
        disabled={playerChips < callAmount}
        sx={{ backgroundColor: '#1976d2' }}
      >
        Suivre ({callAmount} WEN)
      </Button>
      <Button
        variant="contained"
        onClick={() => onRaise(minRaise)}
        disabled={!canRaise}
        sx={{ backgroundColor: '#2e7d32' }}
      >
        Relancer ({minRaise} WEN)
      </Button>
    </Box>
  );
};

export default GameActions; 