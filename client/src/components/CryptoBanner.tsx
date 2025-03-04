import React from 'react';
import { Paper, Grid, Typography, Box } from '@mui/material';
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
  return (
    <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', color: 'white' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box display="flex" alignItems="center">
            <BitcoinIcon sx={{ mr: 1, color: '#f7931a' }} />
            <Typography>
              BTC: ${prices?.bitcoin.usd.toLocaleString() || '---'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography>
            ETH: ${prices?.ethereum.usd.toLocaleString() || '---'}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography>
            SOL: ${prices?.solana.usd.toLocaleString() || '---'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CryptoBanner; 