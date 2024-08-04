import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Select, MenuItem, useTheme, Button, Stack, Divider } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import MyResponsiveTimeRange from "../../components/Calendar";
import LoadingScreen from '../loading';
import RankLine from '../../components/RankLine';
import SurfaceBar from '../../components/SurfaceBar';
import axios from 'axios';
import config from '../../config.json';
import WinLossPie from '../../components/WinLossPie';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';

const getCountryISO2 = require("country-iso-3-to-2");

const parseDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const PlayerPage = () => {
  const { player_id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [playerData, setPlayerData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/player/data?player_id=${player_id}`);
      const data = response.data;
      
      if (!data || !data.playerInfo || data.playerInfo.length === 0) {
        throw new Error("No data available for this player");
      }

      // Validate and clean rankHistory data
      data.rankHistory = (data.rankHistory || []).filter(item => {
        const date = parseDate(item.match_date);
        return date !== null;
      });

      setPlayerData(data);
      
      // Set the initial selected year to the most recent year in the data
      const years = data.rankHistory.map(item => parseDate(item.match_date).getFullYear());
      setSelectedYear(Math.max(...years));
    } catch (error) {
      console.error("Error fetching player data:", error);
      setError(error.message || "An error occurred while fetching player data");
    } finally {
      setLoading(false);
    }
  }, [player_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        textAlign="center"
      >
        <Typography variant="h2" mb={4}>
          Sorry, we couldn't find data for this player
        </Typography>
        <Typography variant="body1" mb={4}>
          {error}
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Box>
    );
  }

  if (!playerData) return null;

  const { playerInfo, rankHistory, surfacePerformance, bestOpponent, worstOpponent } = playerData;
  const player = playerInfo[0];

  // Function to get country emoji
  const getCountryEmoji = (countryCode) => {
    const codePoints = getCountryISO2(countryCode)
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Format date to MM/DD/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <Box m="20px">
      <Header 
        title={`${player.name} ${getCountryEmoji(player.country)}`} 
        subtitle={
          <Typography variant="subtitle1">
            {`${player.hand === 'R' ? 'Right-handed' : 'Left-handed'} • ${formatDate(player.dob)} • ${player.height} cm`}
          </Typography>
        } 
      />
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* Top Row */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography variant="h5" p="15px">Rank Over Time</Typography>
          <Box height="250px" m="-20px 0 0 0">
            <RankLine isDashboard={true} rankHistory={rankHistory.map(item => ({
              date: parseDate(item.match_date),
              rank: item.player_rank
            }))} />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="15px"
          overflow="auto"
        >
          <Typography variant="h5" mb="15px">Career Stats</Typography>
          <Box height="200px">
            <WinLossPie wins={playerData.wins} losses={playerData.losses} />
          </Box>
      </Box>

        {/* Middle Row */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          p="15px"
          position="relative"
        >
          <Typography variant="h5">Match Calendar</Typography>
          <Box position="absolute" top="15px" right="15px">
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {Array.from(new Set(rankHistory.map(item => new Date(item.match_date).getFullYear())))
                .sort((a, b) => b - a)
                .map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))
              }
            </Select>
          </Box>
          <Box height="300px" m="20px 0 0 0">
          <MyResponsiveTimeRange 
            data={playerData.rankHistory
              .filter(item => {
                const date = parseDate(item.match_date);
                return date && date.getFullYear() === selectedYear;
              })
              .map(item => ({ 
                day: parseDate(item.match_date).toISOString().split('T')[0], 
                value: item.win ? 1 : 0 
              }))}
            year={selectedYear} 
            isDashboard={true} 
          />
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Typography variant="h5" p="15px">Performance by Surface</Typography>
          <Box height="250px" m="-20px 0 0 0">
            <SurfaceBar data={surfacePerformance} isDashboard={true} />
          </Box>
        </Box>

         {/* Bottom Row */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          p="20px"
          height="200px"
        >
          <Stack direction="row" spacing={2} height="100%">
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="33%">
              <LeaderboardIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
              <Typography variant="h4" textAlign="center">Ranking</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Stack width="67%" justifyContent="center" alignItems="center" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h5">All-time High</Typography>
                <Typography variant="h3" fontWeight="bold">{playerData.highestRank || 'N/A'}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5">Current</Typography>
                <Typography variant="h3" fontWeight="bold">{playerData.currentRank || 'N/A'}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          p="20px"
          height="200px"
        >
          <Stack direction="row" spacing={2} height="100%">
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="33%">
              <EmojiEventsIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
              <Typography variant="h4" textAlign="center">Rank Points</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Stack width="67%" justifyContent="center" alignItems="center" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h5">All-time High</Typography>
                <Typography variant="h3" fontWeight="bold">{playerData.highestRankPoints || 'N/A'}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5">Current</Typography>
                <Typography variant="h3" fontWeight="bold">{playerData.currentRankPoints || 'N/A'}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          p="20px"
          height="200px"
        >
          <Stack direction="row" spacing={2} height="100%">
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="33%">
              <PeopleIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
              <Typography variant="h4" textAlign="center">Key Opponents</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Stack width="67%" justifyContent="center" alignItems="center" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h5">Best Against</Typography>
                <Typography variant="h3" fontWeight="bold" color="#61cdbb">
                  {bestOpponent ? `${bestOpponent.opponent} (${bestOpponent.wins_against}-${bestOpponent.losses_against})` : 'N/A'}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5">Worst Against</Typography>
                <Typography variant="h3" fontWeight="bold" color="#f47560">
                  {worstOpponent ? `${worstOpponent.opponent} (${worstOpponent.wins_against}-${worstOpponent.losses_against})` : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          p="20px"
          height="200px"
        >
          <Stack direction="row" spacing={2} height="100%">
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="33%">
              <TimelineIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
              <Typography variant="h4" textAlign="center">Longest Streaks</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Stack width="67%" justifyContent="center" alignItems="center" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h5">Win Streak</Typography>
                <Typography variant="h3" fontWeight="bold" color="#61cdbb">{playerData.longestWinStreak || 'N/A'}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5">Loss Streak</Typography>
                <Typography variant="h3" fontWeight="bold" color="#f47560">{playerData.longestLossStreak || 'N/A'}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};


export default PlayerPage;