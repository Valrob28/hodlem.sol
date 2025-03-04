import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import BitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

interface CryptoPrices {
  bitcoin: { usd: number };
  ethereum: { usd: number };
  solana: { usd: number };
}

interface CryptoBannerProps {
  prices: CryptoPrices | null;
}

const CryptoBanner: React.FC<CryptoBannerProps> = ({ prices }) => {
  if (!prices) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        backgroundColor: 'primary.main',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BitcoinIcon />
        <Typography variant="body2">
          BTC: ${prices.bitcoin.usd.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          ETH: ${prices.ethereum.usd.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          SOL: ${prices.solana.usd.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CryptoBanner; 