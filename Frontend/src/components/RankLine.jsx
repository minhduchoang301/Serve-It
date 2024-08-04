import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const RankLine = ({ rankHistory, isDashboard = false }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
  
    // Process the data to fit Nivo's format
    const formattedData = [
      {
        id: "Player Rank",
        data: rankHistory.map(item => ({
          x: item.date,
          y: item.rank
        }))
      }
    ];
  
    return (
      <ResponsiveLine
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
        colors={colors.greenAccent[500]}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        xScale={{ 
          type: "time",
          format: "%Y-%m-%d",
          useUTC: false,
          precision: "day"
        }}
        xFormat="time:%Y-%m-%d"
        yScale={{
          type: "linear",
          stacked: false,
          reverse: true // Reverse for tennis ranking (lower is better)
        }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          format: "20%y",
          legend: "Date",
          legendOffset: 40,
          legendPosition: "middle",
          tickValues: "every 12 months",
        }}
        axisLeft={{
          orient: "left",
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Rank",
          legendOffset: -40,
          legendPosition: "middle"
        }}
        enableGridX={false}
        enableGridY={false}
        pointSize={1}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        enableSlices="x"
        animate={true}
        motionConfig="stiff"
        enableTouchCrosshair={true}
        crosshairType="bottom"
      />
    );
  };
export default RankLine;