import { useTheme } from "@mui/material";
import { ResponsiveTimeRange } from "@nivo/calendar";
import { tokens } from "../theme";
import { mockCalendarData, mockCalendarData as mockData } from "../data/mockData";


const MyResponsiveTimeRange = ({ data = mockCalendarData, year}) => {
    const theme = useTheme();
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;

    return (
        <ResponsiveTimeRange
            data={data}
            theme={{
                text: {
                    fill: tokens(theme.palette.mode).grey[100]
                },
                axis: {
                    ticks: {
                        line: {
                            stroke: tokens(theme.palette.mode).grey[100],
                            strokeWidth: 1,
                        },
                        text: {
                            fill: tokens(theme.palette.mode).grey[100],
                        },
                    },
                },
                legends: {
                    text: {
                        fill: tokens(theme.palette.mode).grey[100],
                    },
                },
                tooltip: {
                    container: {
                        color: tokens(theme.palette.mode).primary[500],
                    },
                },
            }}
            from={from}
            to={to}
            emptyColor="#a29a9a"
            colors={[ '#61cdbb', '#97e3d5', '#e8c1a0', '#f47560' ]}
            margin={{ top: 40, right: 40, bottom: 100, left: 40 }}
            monthLegendOffset={12}
            weekdayLegendOffset={0}
            weekdayTicks={[]}
            dayRadius={2}
            daySpacing={3}
            dayBorderWidth={0}
            dayBorderColor="#ffffff"
            tooltip={e=>{}}
            legends={[]}
        />
    );
};

export default MyResponsiveTimeRange;