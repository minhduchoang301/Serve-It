import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Header from "../../components/Header";
import TennisPlayerGalaxy from "../../components/GoatGalaxy";
import LoadingScreen from "../loading";
import config from '../../config.json';

const GalaxyPage = () => {
  const [data, setData] = useState([]);
  const [surface, setSurface] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://${config.server_host}:${config.server_port}/api/odds/synthetic_score`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  const surfaceOptions = [
    { value: 'All', label: 'All Surfaces' },
    { value: 'Hard', label: 'Hard' },
    { value: 'Clay', label: 'Clay' },
    { value: 'Grass', label: 'Grass' },
    { value: 'Carpet', label: 'Carpet' },
  ];

  const handleSurfaceChange = (event) => {
    setSurface(event.target.value);
  };

  const filteredData = surface === 'All' ? data : data.filter(player => player.surface === surface);

  return (
    <Box 
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Header
          title="GOAT Galaxy"
          subtitle="Visualize player synthetic scores across different surfaces"
        />
        <FormControl variant="outlined" sx={{ minWidth: 200, mt: 2 }}>
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
      </Box>
      <Box 
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <TennisPlayerGalaxy data={filteredData} />
        )}
      </Box>
    </Box>
  );
};

export default GalaxyPage;