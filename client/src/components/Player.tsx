import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Card from './Card';

interface PlayerProps {
  name: string;
  chips: number;
  cards: Array<{ value: string; suit: string }>;
  isActive: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  isCurrentPlayer: boolean;
}

const Player: React.FC<PlayerProps> = ({
  name,
  chips,
  cards,
  isActive,
  position,
  isCurrentPlayer,
}) => {
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: 20, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { bottom: 20, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { left: 20, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { right: 20, top: '50%', transform: 'translateY(-50%)' };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        ...getPositionStyle(),
        display: 'flex',
        flexDirection: position === 'left' || position === 'right' ? 'row' : 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Paper
        sx={{
          p: 2,
          backgroundColor: isCurrentPlayer ? '#f7931a' : 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          minWidth: 150,
        }}
      >
        <Typography variant="subtitle1">{name}</Typography>
        <Typography variant="body2">{chips} WEN</Typography>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {cards.map((card, index) => (
          <Card
            key={index}
            value={card.value}
            suit={card.suit}
            hidden={!isActive}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Player; 