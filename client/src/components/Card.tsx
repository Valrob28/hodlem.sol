import React from 'react';
import { Paper, Typography } from '@mui/material';

interface CardProps {
  value: string;
  suit: string;
  hidden?: boolean;
}

const Card: React.FC<CardProps> = ({ value, suit, hidden = false }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const isRed = suit.toLowerCase() === 'hearts' || suit.toLowerCase() === 'diamonds';

  if (hidden) {
    return (
      <Paper
        sx={{
          width: 70,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: 'white',
          margin: 1,
          cursor: 'pointer',
        }}
      >
        <Typography variant="h6">🂠</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        width: 70,
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: isRed ? 'red' : 'black',
        margin: 1,
        cursor: 'pointer',
      }}
    >
      <Typography variant="h6">{value}</Typography>
      <Typography variant="h6">{getSuitSymbol(suit)}</Typography>
    </Paper>
  );
};

export default Card; 