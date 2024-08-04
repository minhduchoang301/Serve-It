const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const tableRoutes = require('./routes_tables');
const playerRoutes = require('./routes_player');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.post('/api/players/streaks', routes.streaks);
app.get('/api/players/performance-by-surface', routes.performance_by_surface);
app.get('/api/players/all', tableRoutes.all_players);
app.get('/api/tourneys/all', tableRoutes.all_tourneys);
app.post('/api/odds/analysis', routes.analysis);
app.get('/api/odds/synthetic_score', routes.synthetic_score);
app.get('/api/odds/vanilla_pnl', routes.vanilla_pnl);
app.post('/api/players/paginated', routes.paginated);
app.get('/api/players/underdog', routes.underdog);
app.get('/api/odds/factor_strategy',routes.factor_strategy);
app.get('/api/players/time-series-analysis',routes.time_series);

app.get('/api/player/data', playerRoutes.getPlayerData);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
