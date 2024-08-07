import { useTheme } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { tokens } from "../theme";

const TimeSeriesChart = ({ data, metrics, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Transform and validate the data
  const transformedData = metrics.map(metric => ({
    id: metric,
    data: data
      .filter(item => item.period && item[metric] !== null && item[metric] !== undefined && parseFloat(item[metric]) !== 0)
      .map(item => ({
        x: new Date(item.period),
        y: parseFloat(item[metric])
      }))
      .sort((a, b) => a.x - b.x) // Sort by date
  })).filter(series => series.data.length > 0); // Remove empty series

  if (transformedData.length === 0) {
    return <div>No valid data to display</div>;
  }

  return (
    <ResponsiveLine
      data={transformedData}
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
            background: colors.primary[400],
            color: colors.grey[100],
            fontSize: 12,
          },
        },
      }}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{
        type: 'time',
        format: 'native',
        precision: 'day'
      }}
      xFormat="time:%Y-%m-%d"
      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        format: '%b %d',
        tickValues: 5,
        legend: 'Date',
        legendOffset: 36,
        legendPosition: 'middle'
      }}
      axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Value',
        legendOffset: -40,
        legendPosition: 'middle'
      }}
      enablePoints={false}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      curve="monotoneX"
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1
              }
            }
          ]
        }
      ]}
    />
  );
}

export default TimeSeriesChart;