const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/api/players/streaks', routes.streaks);
app.get('/api/players/performance-by-surface', routes.performance_by_surface);
app.get('/api/odds/analysis', routes.analysis);
app.get('/api/odds/synthetic_score', routes.synthetic_score);
app.get('/api/odds/vanilla_pnl', routes.vanilla_pnl);
app.get('/api/players/paginated', routes.paginated);
app.get('/api/players/underdog', routes.underdog);
app.get('/api/odds/factor_strategy',routes.factor_strategy);
app.get('/api/players/time-series-analysis',routes.time_series);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
