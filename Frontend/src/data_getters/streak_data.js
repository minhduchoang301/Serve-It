import { useEffect, useState } from 'react';
import { Box, Container } from '@mui/material';
import { NavLink } from 'react-router-dom';
const config = require('../config.json');

export default function StreaksPage() {
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    // Define the request body
    const requestBody = {
      streak_length: 3,  // Example: minimum streak of 3
      streak_type: 'win',  // Example: looking for winning streaks
      // Add other parameters as needed
    };

    // Make the POST request
    fetch(`http://${config.server_host}:${config.server_port}/api/players/streaks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then(res => res.json())
      .then(resJson => setStreaks(resJson))
      .catch(error => console.error('Error fetching streaks:', error));
  }, []);

  return (
    <Container>
      <h1>Player Streaks</h1>
      {streaks.map((streak, index) => (
        <Box key={index}>
          <p>Player: {streak.player_name}</p>
          <p>Streak Type: {streak.streak_type}</p>
          <p>Streak Length: {streak.streak_length}</p>
          {/* Add more streak details as needed */}
        </Box>
      ))}
    </Container>
  );
}