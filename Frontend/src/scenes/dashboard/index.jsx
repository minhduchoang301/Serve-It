import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import axios from 'axios';
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import RankBump from "../../components/RankBump";
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PublicIcon from '@mui/icons-material/Public';
import CakeIcon from '@mui/icons-material/Cake';
import HeightIcon from '@mui/icons-material/Height';
import WinLossPie from '../../components/WinLossPie';
import config from '../../config';

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [topPlayersData, setTopPlayersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerOfTheDay, setPlayerOfTheDay] = useState(null);

  const fetchTopPlayersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://${config.server_host}:${config.server_port}/api/players/top-players`);
      setTopPlayersData(response.data);
    } catch (error) {
      console.error("Error fetching top players data:", error);
      setError(error.message || "An error occurred while fetching top players data");
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchPlayerOfTheDay = useCallback(async () => {
    try {
      const randomPlayerResponse = await axios.get(`http://${config.server_host}:${config.server_port}/api/players/random-player`);
      const playerId = randomPlayerResponse.data.player_id;
      const playerDataResponse = await axios.get(`http://${config.server_host}:${config.server_port}/api/player/data`, {
        params: { player_id: playerId }
      });
      setPlayerOfTheDay(playerDataResponse.data);
    } catch (error) {
      console.error("Error fetching player of the day:", error);
    }
  }, []);

  useEffect(() => {
    fetchTopPlayersData();
    fetchPlayerOfTheDay();
  }, [fetchTopPlayersData, fetchPlayerOfTheDay]);

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Serve-It" subtitle="The Ace in Tennis Analytics" />

      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="72,107"
            subtitle="Unique Players"
            icon={
              <GroupsIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="31,164"
            subtitle="Matches Played"
            icon={
              <SportsTennisIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="762"
            subtitle="Annual and One-Time Tournaments"
            icon={
              <EmojiEventsIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="123,456"
            subtitle="Matches w/ Odds Saved"
            icon={
              <ShowChartIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 */}
        <Box
          gridColumn="span 8"
          gridRow="span 4"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Top Players Rankings Over Time
              </Typography>
            </Box>
          </Box>
          <Box height="575px" m="-20px 0 0 0">
            {loading ? (
              <Typography>Loading...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <RankBump rankData={topPlayersData} />
            )}
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 4"
          backgroundColor={colors.primary[400]}
          p="30px"
        >
          <Typography variant="h5" fontWeight="600" mb="20px">
            Player of the Day
          </Typography>
          {playerOfTheDay ? (
            <Box display="flex" flexDirection="column">
              <Box
                backgroundColor={colors.primary[600]}
                p="15px"
                borderRadius="4px"
                mb="20px"
              >
                <Typography variant="h3" fontWeight="bold" mb="15px">
                  {playerOfTheDay.playerInfo[0].name}
                </Typography>
                <Box display="flex" flexWrap="wrap" justifyContent="space-between">
                  <Box display="flex" alignItems="center" mb="10px" width="48%">
                    <SportsTennisIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                    <Typography variant="body2">
                      {playerOfTheDay.playerInfo[0].hand === 'R' ? 'Right-handed' : 'Left-handed'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb="10px" width="48%">
                    <PublicIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                    <Typography variant="body2">
                      {playerOfTheDay.playerInfo[0].country}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb="10px" width="48%">
                    <CakeIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                    <Typography variant="body2">
                      {new Date(playerOfTheDay.playerInfo[0].dob).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb="10px" width="48%">
                    <HeightIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
                    <Typography variant="body2">
                      {playerOfTheDay.playerInfo[0].height} cm
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="180px"
                backgroundColor={colors.primary[600]}
                borderRadius="4px"
                mb="20px"
              >
                <Box height="150px" width="150px">
                  <WinLossPie wins={playerOfTheDay.wins} losses={playerOfTheDay.matchesPlayed - playerOfTheDay.wins} />
                </Box>
              </Box>

              <Box
                backgroundColor={colors.primary[600]}
                p="15px"
                borderRadius="4px"
              >
                <Typography variant="h6" fontWeight="600" mb="10px">
                  Career Statistics
                </Typography>
                <Box display="flex" justifyContent="space-between" width="100%" mb="5px">
                  <Typography variant="body2">Matches Played:</Typography>
                  <Typography variant="body2" fontWeight="bold">{playerOfTheDay.matchesPlayed}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" width="100%" mb="5px">
                  <Typography variant="body2">Highest Rank:</Typography>
                  <Typography variant="body2" fontWeight="bold">{playerOfTheDay.highestRank}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" width="100%">
                  <Typography variant="body2">Current Rank:</Typography>
                  <Typography variant="body2" fontWeight="bold">{playerOfTheDay.currentRank}</Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>Loading player data...</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;