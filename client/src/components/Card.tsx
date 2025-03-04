import React from 'react';
import { Box, Typography } from '@mui/material';

interface CardProps {
  value: string;
  suit: string;
  hidden?: boolean;
  isMobile?: boolean;
}

const Card: React.FC<CardProps> = ({ value, suit, hidden = false, isMobile = false }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
        return '♠';
      default:
        return '';
    }
  };

  const getColor = (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'hearts':
      case 'diamonds':
        return '#ff0000';
      default:
        return '#000000';
    }
  };

  if (hidden) {
    return (
      <Box
        sx={{
          width: isMobile ? '40px' : '60px',
          height: isMobile ? '60px' : '90px',
          backgroundColor: '#2c3e50',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: isMobile ? '40px' : '60px',
        height: isMobile ? '60px' : '90px',
        backgroundColor: '#ffffff',
        borderRadius: '5px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        position: 'relative',
      }}
    >
      <Typography
        variant={isMobile ? 'body2' : 'h6'}
        sx={{
          color: getColor(suit),
          position: 'absolute',
          top: '5px',
          left: '5px',
        }}
      >
        {value}
      </Typography>
      <Typography
        variant={isMobile ? 'h6' : 'h4'}
        sx={{
          color: getColor(suit),
        }}
      >
        {getSuitSymbol(suit)}
      </Typography>
      <Typography
        variant={isMobile ? 'body2' : 'h6'}
        sx={{
          color: getColor(suit),
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          transform: 'rotate(180deg)',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default Card; 