import { useTheme } from "@mui/material";
import { ResponsiveTimeRange } from "@nivo/calendar";
import { tokens } from "../theme";
import { mockCalendarData as mockData } from "../data/mockData";


const MyResponsiveTimeRange = ({ data = mockData }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    <ResponsiveTimeRange
        data={data}
        from="2018-04-01"
        to="2018-08-12"
        emptyColor="#eeeeee"
        colors={[ '#61cdbb', '#97e3d5', '#e8c1a0', '#f47560' ]}
        margin={{ top: 40, right: 40, bottom: 100, left: 40 }}
        dayRadius={10}
        daySpacing={6}
        dayBorderWidth={0}
        dayBorderColor="#ffffff"
        legends={[
            {
                anchor: 'bottom-right',
                direction: 'row',
                justify: false,
                itemCount: 4,
                itemWidth: 42,
                itemHeight: 36,
                itemsSpacing: 14,
                itemDirection: 'right-to-left',
                translateX: -60,
                translateY: -60,
                symbolSize: 20
            }
        ]}
    />
}