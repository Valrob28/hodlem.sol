import React, { useState } from 'react';
import { Box, Button, TextField, Stack } from '@mui/material';

interface GameActionsProps {
  onFold: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  currentBet: number;
  isMobile?: boolean;
}

const GameActions: React.FC<GameActionsProps> = ({
  onFold,
  onCall,
  onRaise,
  currentBet,
  isMobile = false,
}) => {
  const [raiseAmount, setRaiseAmount] = useState(currentBet);

  const handleRaise = () => {
    if (raiseAmount > currentBet) {
      onRaise(raiseAmount);
    }
  };

  return (
    <Stack
      direction={isMobile ? 'column' : 'row'}
      spacing={isMobile ? 1 : 2}
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        p: isMobile ? 1 : 2,
        borderRadius: 1,
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={onFold}
        size={isMobile ? 'small' : 'medium'}
      >
        Se coucher
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={onCall}
        size={isMobile ? 'small' : 'medium'}
      >
        Suivre ({currentBet})
      </Button>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          type="number"
          value={raiseAmount}
          onChange={(e) => setRaiseAmount(Number(e.target.value))}
          size={isMobile ? 'small' : 'medium'}
          sx={{ width: isMobile ? '100px' : '150px' }}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRaise}
          size={isMobile ? 'small' : 'medium'}
        >
          Relancer
        </Button>
      </Box>
    </Stack>
  );
};

export default GameActions; 