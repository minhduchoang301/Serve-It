import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Autocomplete, 
  InputBase, 
  IconButton, 
  Paper, 
  Divider, 
  useTheme, 
  Alert 
} from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import axios from 'axios';
import debounce from "lodash/debounce";
import config from '../../config';
import { tokens } from "../../theme";

const PlayerSearchPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchPlayers = async (term) => {
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/search-players`, {
        params: { term }
      });
      setOptions(response.data);
    } catch (error) {
      console.error("Error searching players:", error);
      setError("An error occurred while searching for players. Please try again.");
    }
  };

  const debouncedSearch = debounce(searchPlayers, 300);

  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
    } else {
      setOptions([]);
    }
  }, [searchTerm]);

  const fetchPlayerData = async (playerId) => {
    setLoading(true);
    setError(null);
    try {
      const [streaksRes, pnlRes, underdogRes] = await Promise.all([
        axios.get(`http://${config.server_host}:${config.server_port}/api/players/streaks`, { params: { player_id: playerId } }),
        axios.get(`http://${config.server_host}:${config.server_port}/api/odds/vanilla_pnl`, { params: { player_id: playerId } }),
        axios.get(`http://${config.server_host}:${config.server_port}/api/players/underdog`, { params: { player_id: playerId } })
      ]);

      const streaks = streaksRes.data;
      const pnl = pnlRes.data[0];
      const underdog = underdogRes.data[0];

      if (!streaks.length && !pnl && !underdog) {
        setError("No data found for this player.");
        setPlayerData(null);
      } else {
        setPlayerData({ streaks, pnl, underdog });
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      setError("An error occurred while fetching player data. Please try again.");
      setPlayerData(null);
    }
    setLoading(false);
  };

  const handleInputChange = (event, value) => {
    setSearchTerm(value);
  };

  const handleSelectPlayer = (event, value) => {
    if (value) {
      setSearchTerm("");  // Reset the search term
      fetchPlayerData(value.player_id);
    }
  };

  const renderResults = () => {
    if (error) {
      return (
        <Alert severity="info" sx={{ mt: 2, backgroundColor: colors.primary[400], color: colors.grey[100] }}>
          {error}
        </Alert>
      );
    }

    if (!playerData) return null;

    const { streaks, pnl, underdog } = playerData;

    const winStreaks = streaks.filter(streak => streak.streak_type === 'W');
    const lossStreaks = streaks.filter(streak => streak.streak_type === 'L');

    const countStreaks = (streaks, length) => streaks.filter(s => s.streak_length === length).length;

    return (
      <Paper elevation={3} sx={{ p: 3, backgroundColor: colors.primary[400] }}>
        <Typography variant="h4" color={colors.greenAccent[500]} gutterBottom>
          {pnl.player_name}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h6" color={colors.greenAccent[300]}>P&L from betting</Typography>
            <Typography variant="h4">{pnl.profit_loss.toFixed(2)}%</Typography>
          </Box>
          <Box>
            <Typography variant="h6" color={colors.greenAccent[300]}>Underdog win percentage</Typography>
            <Typography variant="h4">{underdog ? underdog.underdog_win_percentage.toFixed(2) : 'N/A'}%</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="h5" color={colors.greenAccent[300]} gutterBottom>Win Streaks</Typography>
            <Typography>3 games: {countStreaks(winStreaks, 3)}</Typography>
            <Typography>4 games: {countStreaks(winStreaks, 4)}</Typography>
            <Typography>5 games: {countStreaks(winStreaks, 5)}</Typography>
            <Typography>6 games: {countStreaks(winStreaks, 6)}</Typography>
            <Typography>7+ games: {winStreaks.filter(s => s.streak_length >= 7).length}</Typography>
            <Typography fontWeight="bold">Longest streak: {Math.max(...winStreaks.map(s => s.streak_length), 0)}</Typography>
          </Box>
          <Box>
            <Typography variant="h5" color={colors.greenAccent[300]} gutterBottom>Loss Streaks</Typography>
            <Typography>3 games: {countStreaks(lossStreaks, 3)}</Typography>
            <Typography>4 games: {countStreaks(lossStreaks, 4)}</Typography>
            <Typography>5 games: {countStreaks(lossStreaks, 5)}</Typography>
            <Typography>6 games: {countStreaks(lossStreaks, 6)}</Typography>
            <Typography>7+ games: {lossStreaks.filter(s => s.streak_length >= 7).length}</Typography>
            <Typography fontWeight="bold">Longest streak: {Math.max(...lossStreaks.map(s => s.streak_length), 0)}</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box p={4} maxWidth="800px" margin="auto">
      <Typography variant="h2" color={colors.greenAccent[300]} mb={2} textAlign="center">
        Player Betting Insights
      </Typography>
      <Typography variant="h5" color={colors.grey[300]} mb={4} textAlign="center">
        Enter a player's name to get specific betting results and streak information
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: colors.primary[400], 
          maxWidth: 500, 
          margin: 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={(option) => option.name || ""}
          renderInput={(params) => (
            <InputBase
              {...params.InputProps}
              sx={{
                ml: 2,
                flex: 1,
                width: "375px",
                "& .MuiAutocomplete-input": {
                  padding: "10px 0 !important",
                }
              }}
              placeholder="Search for a player"
              inputProps={{
                ...params.inputProps,
                "aria-label": "search",
              }}
            />
          )}
          onInputChange={handleInputChange}
          onChange={handleSelectPlayer}
          filterOptions={(x) => x}
          renderOption={(props, option) => (
            <li {...props} style={{ padding: "8px 16px" }}>
              {option.name}
            </li>
          )}
          loading={searchTerm.trim() !== '' && options.length === 0}
          loadingText="Searching..."
          value={null}
          sx={{ flex: 1 }}
        />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box mt={4} display="flex" justifyContent="center">
          <Box maxWidth="700px" width="100%">
            {renderResults()}
          </Box>
        </Box>
      )}

      <Box mt={60} display="flex" justifyContent="space-around" maxWidth="700px" margin="50px">
        <Box textAlign="center">
          <SportsBaseballIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
          <Typography variant="h5" color={colors.grey[300]} mt={1}>
            Player Performance
          </Typography>
          <Typography variant="body1" color={colors.grey[400]}>
            Analyze win/loss streaks
          </Typography>
        </Box>
        <Box textAlign="center">
          <TrendingUpIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
          <Typography variant="h5" color={colors.grey[300]} mt={1}>
            Betting Insights
          </Typography>
          <Typography variant="body1" color={colors.grey[400]}>
            View P&L from betting
          </Typography>
        </Box>
        <Box textAlign="center">
          <EmojiEventsIcon sx={{ fontSize: 40, color: colors.greenAccent[500] }} />
          <Typography variant="h5" color={colors.grey[300]} mt={1}>
            Underdog Success
          </Typography>
          <Typography variant="body1" color={colors.grey[400]}>
            Check underdog win rates
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PlayerSearchPage;