import React, { useState, useEffect } from 'react';
import { Box, Grid, Button, Typography, Autocomplete, TextField, Chip, Paper, CircularProgress, useTheme, InputAdornment } from '@mui/material';
import StatBox from '../../components/StatBox';
import Header from '../../components/Header';
import axios from 'axios';
import config from '../../config';
import { tokens } from "../../theme";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const BettingDashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [extremeStats, setExtremeStats] = useState({
    bestUnderdog: null,
    mostWinStreaks: null,
    mostLossStreaks: null
  });
  const [factors, setFactors] = useState([]);
  const [weights, setWeights] = useState([]);
  const [year, setYear] = useState(2023);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [unitSize, setUnitSize] = useState(100);

  const availableFactors = [
    'Aces', 'Double Faults', 'Service Points', 'First Serve In',
    'First Serve Points Won', 'Second Serve Points Won', 'Service Games',
    'Break Points Saved', 'Break Points Faced',
  ];
  
  const factorMapping = {
    'Aces': 'ace', 'Double Faults': 'df', 'Service Points': 'svpt',
    'First Serve In': '1stIn', 'First Serve Points Won': '1stWon',
    'Second Serve Points Won': '2ndWon', 'Service Games': 'SvGms',
    'Break Points Saved': 'bpSaved', 'Break Points Faced': 'bpFaced',
  };

  useEffect(() => {
    fetchExtremeStats();
  }, []);

  const fetchExtremeStats = async () => {
    try {
      const [bestUnderdogRes, streakiestPlayersRes] = await Promise.all([
        axios.get(`http://${config.server_host}:${config.server_port}/api/players/underdog`),
        axios.get(`http://${config.server_host}:${config.server_port}/api/players/streaks`, {
          params: { streak_length: 5 }
        })
      ]);

      setExtremeStats({
        bestUnderdog: bestUnderdogRes.data[0],
        mostWinStreaks: streakiestPlayersRes.data.find(player => player.streak_type === 'W'),
        mostLossStreaks: streakiestPlayersRes.data.find(player => player.streak_type === 'L')
      });
    } catch (error) {
      console.error('Error fetching extreme stats:', error);
    }
  };

  const handleFactorChange = (event, newFactors) => {
    setFactors(newFactors);
    setWeights(new Array(newFactors.length).fill(1));
  };

  const handleWeightChange = (index, value) => {
    const newWeights = [...weights];
    newWeights[index] = parseFloat(value);
    setWeights(newWeights);
  };

  const handleYearChange = (event) => {
    setYear(parseInt(event.target.value));
  };
  
  const handleUnitSizeChange = (event) => {
    setUnitSize(parseFloat(event.target.value));
  };

  const handleStrategySubmit = async () => {
    if (factors.length === 0 || weights.length === 0) {
      console.error('Incomplete data for strategy analysis');
      return;
    }
    setLoading(true);
    try {
      const mappedFactors = factors.map(factor => factorMapping[factor]);
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/odds/factor_strategy`, {
        params: {
          fields: mappedFactors.join(','),
          weights: weights.join(','),
          year: year
        }
      });
      setResults({
        factorStrategy: response.data
      });
    } catch (error) {
      console.error('Error fetching strategy results:', error);
    }
    setLoading(false);
  };

  return (
    <Box m="20px">
      <Header title="Strategy Builder" subtitle="Analyze betting strategies based on Previous Player Statistics" />
      
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <EmojiEventsIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
            <Typography variant="h5" color={colors.grey[300]} mt={1}>
              Best Underdog
            </Typography>
            <Typography variant="h4" color={colors.greenAccent[500]} mt={1}>
              {extremeStats.bestUnderdog?.player_name || 'Loading...'}
            </Typography>
            <Typography variant="body1" color={colors.grey[400]}>
              Wins as the Underdog: {extremeStats.bestUnderdog?.times_beat_the_odds.toFixed(0) || 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <TrendingUpIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
            <Typography variant="h5" color={colors.grey[300]} mt={1}>
              Most 5+ Game Win Streaks
            </Typography>
            <Typography variant="h4" color={colors.greenAccent[500]} mt={1}>
              {extremeStats.mostWinStreaks?.player_name || 'Loading...'}
            </Typography>
            <Typography variant="body1" color={colors.grey[400]}>
              Streaks: {extremeStats.mostWinStreaks?.streak_length || 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box textAlign="center">
            <TrendingDownIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
            <Typography variant="h5" color={colors.grey[300]} mt={1}>
              Most 5+ Game Loss Streaks
            </Typography>
            <Typography variant="h4" color={colors.greenAccent[500]} mt={1}>
              {extremeStats.mostLossStreaks?.player_name || 'Loading...'}
            </Typography>
            <Typography variant="body1" color={colors.grey[400]}>
              Streaks: {extremeStats.mostLossStreaks?.streak_length || 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: colors.primary[400] }}>
            <Typography variant="h4" color={colors.greenAccent[500]} gutterBottom>
              Strategy Analysis
            </Typography>
            
            <Autocomplete
              multiple
              options={availableFactors}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Select Factors" placeholder="Factors" sx={{ mb: 2 }} />
              )}
              onChange={handleFactorChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
            />
            
            {factors.map((factor, index) => (
              <TextField
                key={factor}
                label={`Weight for ${factor}`}
                type="number"
                inputProps={{ step: "0.01" }}
                value={weights[index]}
                onChange={(e) => handleWeightChange(index, e.target.value)}
                fullWidth
                margin="normal"
                sx={{ mb: 2 }}
              />
            ))}
            
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={handleYearChange}
              fullWidth
              margin="normal"
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleStrategySubmit} 
              sx={{ mt: 2, backgroundColor: colors.greenAccent[700] }}
            >
              Analyze
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: colors.primary[400], height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h4" color={colors.greenAccent[500]} gutterBottom>
              Results
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <TextField
                  label="Unit Size ($)"
                  type="number"
                  value={unitSize}
                  onChange={handleUnitSizeChange}
                  fullWidth
                  margin="normal"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <Typography variant="h6" color={colors.greenAccent[300]} gutterBottom>
                  P&L Multiplier: {results.factorStrategy?.profit_loss?.toFixed(2) || 'N/A'}
                </Typography>
                <Typography variant="h4" color={colors.greenAccent[300]} gutterBottom>
                  Total P&L: ${((results.factorStrategy?.profit_loss || 0) * unitSize).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box mt={8}>
            <Typography variant="h5" color={colors.grey[300]} gutterBottom>
                How It Works
            </Typography>
            <Typography variant="body1" color={colors.grey[400]} gutterBottom>
                The strategy builder allows you to analyze and test betting strategies based on historical player statistics. 
                You can select various performance factors (e.g., Aces, Double Faults) and assign weights to each factor to 
                create a custom strategy. The system calculates a synthetic score for each player and determines the best 
                player to bet on in each match.
            </Typography>
            <Typography variant="body1" color={colors.grey[400]} gutterBottom>
                The profit and loss (PnL) figure represents the net profit or loss if you had bet a consistent amount (1 unit) 
                on each match according to the strategy. For each match, if the player you bet on wins, the profit is calculated 
                based on the odds minus 1. If the player loses, the loss is simply 1 unit. The total PnL is the sum of all these 
                individual match PnLs, showing the overall performance of the strategy.
            </Typography>
        </Box>
    </Box>
  );
};

export default BettingDashboard;