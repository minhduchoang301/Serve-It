import { ResponsiveBump } from "@nivo/bump";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const RankBump = ({ rankData, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Sort rankData by year in ascending order
  rankData.sort((a, b) => a.year - b.year);
  const years = rankData.map(d => d.year);
  const mostRecentYear = years[years.length - 1];

  // Process the data to fit Nivo's Bump chart format
  const formattedData = [];
  const playerMap = new Map();

  rankData.forEach(yearData => {
    for (let i = 1; i <= 10; i++) {
      const player = yearData[`rank${i}`];
      if (player) {
        if (!playerMap.has(player)) {
          playerMap.set(player, {
            id: player,
            data: years.map(year => ({ x: year, y: null }))
          });
        }
        const playerData = playerMap.get(player);
        const yearIndex = years.indexOf(yearData.year);
        playerData.data[yearIndex].y = i;
      }
    }
  });

  playerMap.forEach((playerData, player) => {
    // Only add players who have at least one ranking
    if (playerData.data.some(d => d.y !== null)) {
      // Add label only for players in the most recent year
      if (playerData.data[playerData.data.length - 1].y !== null) {
        playerData.label = player;
      }
      formattedData.push(playerData);
    }
  });

  return (
    <ResponsiveBump
      data={formattedData}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
        tooltip: {
          container: {
            color: colors.primary[500],
          },
        },
      }}
      lineWidth={3}
      activeLineWidth={6}
      inactiveLineWidth={3}
      inactiveOpacity={0.15}
      pointSize={10}
      activePointSize={16}
      inactivePointSize={0}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={3}
      activePointBorderWidth={3}
      pointBorderColor={{ from: 'serie.color' }}
      axisTop={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Year',
        legendPosition: 'middle',
        legendOffset: 32
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Ranking',
        legendPosition: 'middle',
        legendOffset: -40,
        tickValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }}
      margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
      axisRight={null}
      yScale={{ type: 'linear', min: 1, max: 10, reverse: true }}
    />
  );
};

export default RankBump;