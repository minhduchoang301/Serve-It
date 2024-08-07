import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, FormGroup, FormControlLabel, TextField, Autocomplete } from "@mui/material";
import Header from "../../components/Header";
import TimeSeriesChart from "../../components/TimeSeriesChart";
import LoadingScreen from "../loading";
import config from '../../config.json';

const TimeSeriesPage = () => {
  const [data, setData] = useState([]);
  const [seasonality, setSeasonality] = useState('monthly');
  const [metrics, setMetrics] = useState({
    avg_aces: true,
    avg_double_faults: true,
    matches_won: true,
    total_matches_played: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [surface, setSurface] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerOptions, setPlayerOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [seasonality, startDate, endDate, surface, playerName]);

  useEffect(() => {
    fetchPlayerOptions();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        seasonality,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(surface && { surface }),
        ...(playerName && { player_name: playerName }),
      });
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/players/time-series-analysis?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  const fetchPlayerOptions = async () => {
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/players`);
      const result = await response.json();
      setPlayerOptions(result.map(player => player.name));
    } catch (error) {
      console.error("Error fetching player options:", error);
    }
  };

  const seasonalityOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const metricOptions = [
    { value: 'avg_aces', label: 'Average Aces' },
    { value: 'avg_double_faults', label: 'Average Double Faults' },
    { value: 'matches_won', label: 'Matches Won' },
    { value: 'total_matches_played', label: 'Total Matches Played' },
  ];

  const surfaceOptions = [
    { value: '', label: 'All Surfaces' },
    { value: 'Hard', label: 'Hard' },
    { value: 'Clay', label: 'Clay' },
    { value: 'Grass', label: 'Grass' },
    { value: 'Carpet', label: 'Carpet' },
  ];

  const handleSeasonalityChange = (event) => {
    setSeasonality(event.target.value);
  };

  const handleMetricChange = (event) => {
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      [event.target.name]: event.target.checked
    }));
  };

  const handleSurfaceChange = (event) => {
    setSurface(event.target.value);
  };

  return (
    <Box m="20px">
      <Header
        title="Tennis Player Performance Over Time"
        subtitle="Visualize player statistics across different time periods"
      />
      <Box mb={2} display="flex" flexWrap="wrap" gap={2}>
        <FormControl variant="outlined" style={{ minWidth: 200 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={seasonality}
            onChange={handleSeasonalityChange}
            label="Time Period"
          >
            {seasonalityOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" style={{ minWidth: 200 }}>
          <InputLabel>Surface</InputLabel>
          <Select
            value={surface}
            onChange={handleSurfaceChange}
            label="Surface"
          >
            {surfaceOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <Autocomplete
          style={{ minWidth: 300 }}
          options={playerOptions}
          value={playerName}
          onChange={(event, newValue) => setPlayerName(newValue)}
          renderInput={(params) => <TextField {...params} label="Player Name" />}
        />
      </Box>
      <Box mb={2}>
        <FormGroup row>
          {metricOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={metrics[option.value]}
                  onChange={handleMetricChange}
                  name={option.value}
                  color="secondary"
                />
              }
              label={option.label}
            />
          ))}
        </FormGroup>
      </Box>
      <Box height="75vh">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <TimeSeriesChart 
            data={data} 
            metrics={Object.keys(metrics).filter(key => metrics[key])} 
          />
        )}
      </Box>
    </Box>
  );
};

export default TimeSeriesPage;