const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const tableRoutes = require('./routes_tables');
const playerRoutes = require('./routes_player');
const dashboardRoutes = require('./routes_dashboard');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/api/players/streaks', routes.streaks); // Done
app.get('/api/players/performance-by-surface', routes.performance_by_surface); // Done
app.get('/api/players/all', tableRoutes.all_players);  // Done
app.get('/api/tourneys/all', tableRoutes.all_tourneys);  // Done
app.get('/api/matches/all', tableRoutes.all_matches);  // Done
app.post('/api/odds/analysis', routes.analysis); // Done
app.get('/api/odds/synthetic_score', routes.synthetic_score); // Done
app.get('/api/odds/vanilla_pnl', routes.vanilla_pnl); // Done
app.post('/api/players/paginated', routes.paginated);  // Done
app.get('/api/players/underdog', routes.underdog);  // Done
app.get('/api/players/worst-favorite', routes.worstFavorite);  // Done
app.get('/api/odds/factor_strategy',routes.factor_strategy); // Done
app.get('/api/players/time-series-analysis',routes.time_series); // Done
app.get('/api/players/top-players', dashboardRoutes.getTopPlayers); // Done
app.get('/api/players/random-player', dashboardRoutes.getRandomPlayer); // Done

app.get('/api/player/data', playerRoutes.getPlayerData); // Done

// Search Bar Query
app.get('/search-players', routes.searchPlayers); // Done

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
