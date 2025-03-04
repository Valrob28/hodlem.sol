import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Card from './Card';

interface PlayerProps {
  player: {
    name: string;
    chips: number;
    cards: Array<{ value: string; suit: string }>;
    isActive: boolean;
    isSpectator: boolean;
  };
  isCurrentPlayer?: boolean;
  isSpectator?: boolean;
  isWaiting?: boolean;
  isMobile?: boolean;
}

const Player: React.FC<PlayerProps> = ({
  player,
  isCurrentPlayer = false,
  isSpectator = false,
  isWaiting = false,
  isMobile = false,
}) => {
  return (
    <Paper
      elevation={isCurrentPlayer ? 8 : 2}
      sx={{
        p: isMobile ? 1 : 2,
        backgroundColor: isCurrentPlayer ? 'primary.main' : 'background.paper',
        border: isCurrentPlayer ? '2px solid' : 'none',
        borderColor: 'secondary.main',
        opacity: isSpectator ? 0.7 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      <Typography
        variant={isMobile ? 'body2' : 'subtitle1'}
        sx={{
          color: isCurrentPlayer ? 'white' : 'text.primary',
          textAlign: 'center',
          mb: 1,
        }}
      >
        {player.name}
      </Typography>
      <Typography
        variant={isMobile ? 'caption' : 'body2'}
        sx={{
          color: isCurrentPlayer ? 'white' : 'text.secondary',
          textAlign: 'center',
          mb: 1,
        }}
      >
        {player.chips} jetons
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? 0.5 : 1,
        }}
      >
        {player.cards.map((card, index) => (
          <Card
            key={index}
            value={card.value}
            suit={card.suit}
            hidden={isWaiting}
            isMobile={isMobile}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default Player; 