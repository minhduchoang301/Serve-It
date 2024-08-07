import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Header from "../../components/Header";
import SurfaceSwarmPlot from "../../components/SurfaceSwarm";
import LoadingScreen from "../loading";
import config from '../../config.json';

const SwarmPlotPage = () => {
  const [data, setData] = useState([]);
  const [yAxis, setYAxis] = useState('win_loss_percentage');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/players/performance-by-surface`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  const yAxisOptions = [
    { value: 'win_loss_percentage', label: 'Win-Loss Percentage' },
    { value: 'avg_aces', label: 'Average Aces' },
    { value: 'avg_double_faults', label: 'Average Double Faults' },
    { value: 'avg_first_serves_in', label: 'Average First Serves In' },
  ];

  const handleYAxisChange = (event) => {
    setYAxis(event.target.value);
  };

  return (
    <Box m="20px">
      <Header 
        title="Tennis Player Performance SwarmPlot" 
        subtitle="Visualize player statistics across different surfaces"
      />
      <Box mb={2}>
        <FormControl variant="outlined" style={{ minWidth: 200 }}>
          <InputLabel>Y-Axis Metric</InputLabel>
          <Select
            value={yAxis}
            onChange={handleYAxisChange}
            label="Y-Axis Metric"
          >
            {yAxisOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box height="75vh">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <SurfaceSwarmPlot data={data} yAxis={yAxis} />
        )}
      </Box>
    </Box>
  );
};

export default SwarmPlotPage;