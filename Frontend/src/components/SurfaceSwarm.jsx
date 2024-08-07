import { useTheme } from "@mui/material";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { tokens } from "../theme";

const SurfaceSwarmPlot = ({ data, yAxis, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Transform the data to the format expected by Nivo SwarmPlot
  const transformedData = data.map(item => ({
    id: `${item.name}-${item.surface}`,
    group: item.surface,
    [yAxis]: item[yAxis],
    volume: item.total_matches
  }));

  const renderHexagon = (ctx, { x, y, size, color }) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const xPos = x + size * Math.cos(angle);
      const yPos = y + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(xPos, yPos);
      } else {
        ctx.lineTo(xPos, yPos);
      }
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  return (
    <ResponsiveSwarmPlot
      data={transformedData}
      groups={['Carpet', 'Clay', 'Grass', 'Hard']}
      identity="id"
      value={yAxis}
      valueFormat={value => (Number.isInteger(value) ? value.toString() : value.toFixed(2))}
      valueScale={{ type: 'linear', min: 'auto', max: 'auto', reverse: false }}
      size={{
        key: 'volume',
        values: [0, 500],
        sizes: [4, 40]
      }}
      forceStrength={2}
      simulationIterations={50}
      borderColor={{
        from: 'color',
        modifiers: [
          ['darker', 0.6],
          ['opacity', 0.5]
        ]
      }}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: 'none',
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
              fontSize: 16,  // Increased font size
            },
          },
          ticks: {
            line: {
              stroke: 'none',
              strokeWidth: 0,
            },
            text: {
              fill: colors.grey[100],
              fontSize: 14,  // Increased font size
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
            fontSize: 14,  // Increased font size
          },
        },
        tooltip: {
          container: {
            background: colors.primary[400],
            color: colors.grey[100],
            fontSize: 14,  // Increased font size
          },
        },
      }}
      gap = {40}
      margin={{ top: 80, right: 100, bottom: 80, left: 100 }}
      // remove horizontal grid lines
      enableGridY={false}

      axisBottom={{
        orient: 'bottom',
        tickSize: 10,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Surface',
        legendPosition: 'middle',
        legendOffset: 46,
        truncateTickAt: 0
      }}
      axisLeft={{
        orient: 'left',
        tickSize: 10,
        tickPadding: 5,
        tickRotation: 0,
        legend: yAxis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        legendPosition: 'middle',
        legendOffset: -76,
        truncateTickAt: 0
      }}
      motionConfig={{
        mass: 149,
        tension: 321,
        friction: 346,
        clamp: false,
        precision: 0.01,
        velocity: 0
    }}
    />
  );
}

export default SurfaceSwarmPlot;