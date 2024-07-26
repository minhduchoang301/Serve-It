const mysql = require('mysql')
const config = require('./config.json')

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db
});
connection.connect((err) => err && console.log(err));

/******************
 * WARM UP ROUTES *
 ******************/
const streaks = async function (req, res) {
  const {
    player_id,
    streak_length = 3,
    streak_type,
    start_date,
    end_date,
    min_rank,
    max_rank,
    surface,
    tournament_id,
    country_code
  } = req.body;

  // Initial query setup, dynamically adjusting based on streak type
  let query = `
SELECT 
  p.player_id,
  p.name AS player_name,
  '${streak_type}' AS streak_type,
  COUNT(*) AS streak_length,
  MIN(m.tourney_date) AS start_date,
  MAX(m.tourney_date) AS end_date,
  t.surface,
  t.tourney_name,
  p.rank AS rank_during_streak
FROM 
  Tourney_Match m
JOIN 
  Player p ON p.player_id = ${streak_type === 'win' ? 'm.winner_id' : 'm.loser_id'}
JOIN 
  Tourney t ON m.tourney_id = t.tourney_id
WHERE 
  1 = 1`;

  // Adding dynamic filtering based on query parameters
  if (player_id) {
    query += ` AND p.player_id = ${connection.escape(player_id)}`;
  }
  if (streak_length) {
    query += ` AND COUNT(*) >= ${connection.escape(streak_length)}`;
  }
  if (start_date) {
    query += ` AND m.tourney_date >= ${connection.escape(start_date)}`;
  }
  if (end_date) {
    query += ` AND m.tourney_date <= ${connection.escape(end_date)}`;
  }
  if (min_rank) {
    query += ` AND p.rank >= ${connection.escape(min_rank)}`;
  }
  if (max_rank) {
    query += ` AND p.rank <= ${connection.escape(max_rank)}`;
  }
  if (surface) {
    query += ` AND t.surface = ${connection.escape(surface)}`;
  }
  if (tournament_id) {
    query += ` AND t.tourney_id = ${connection.escape(tournament_id)}`;
  }
  if (country_code) {
    query += ` AND p.country_code = ${connection.escape(country_code)}`;
  }

  // Group and order by essential identifiers
  query += `
GROUP BY p.player_id
HAVING COUNT(*) >= ${connection.escape(streak_length)}
ORDER BY p.player_id, MIN(m.tourney_date)`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Failed to retrieve streak data');
    }
    res.json(results);
  });
}

const performance_by_surface = async function (req, res) {
  const { player_id, player_name, surface, min_matches, start_date, end_date } = req.query;

  let query = `
  SELECT 
    p.player_id, p.name, t.surface,
    COUNT(*) AS total_matches,
    SUM(CASE WHEN m.winner_id = p.player_id THEN 1 ELSE 0 END) AS matches_won,
    AVG(m.w_ace) AS avg_aces,
    AVG(m.w_df) AS avg_double_faults,
    AVG(m.w_1stIn) AS avg_first_serves_in
  FROM Player p
  JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
  JOIN Tourney t ON m.tourney_id = t.tourney_id
  WHERE 1 = 1`;

  if (player_id) {
    query += ` AND p.player_id = ${connection.escape(player_id)}`;
  }
  if (player_name) {
    query += ` AND p.name LIKE ${connection.escape('%' + player_name + '%')}`;
  }
  if (surface) {
    query += ` AND t.surface = ${connection.escape(surface)}`;
  }
  if (start_date) {
    query += ` AND m.tourney_date >= ${connection.escape(start_date)}`;
  }
  if (end_date) {
    query += ` AND m.tourney_date <= ${connection.escape(end_date)}`;
  }

  query += ' GROUP BY p.player_id, p.name, t.surface';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Failed to retrieve player performance data');
    }
    res.json(results);
  });
}

const analysis = async function (req, res) {
  const { odds_maker, start_date, end_date, min_odds, max_odds, min_rank, max_rank } = req.body;

  let query = `
  SELECT 
    o.odds_maker,
    COUNT(*) AS total_bets,
    AVG(o.odds) AS avg_odds,
    VAR_POP(o.odds) AS variance,
    SUM(CASE WHEN p.player_id = m.winner_id THEN 1 ELSE 0 END) / COUNT(*) * 100 AS hit_rate
  FROM Odds o
  JOIN Tourney_Match m ON o.match_num = m.match_num AND o.tourney_id = m.tourney_id
  JOIN Player p ON o.player_id = p.player_id
  WHERE 1 = 1`;

  if (odds_maker) {
    query += ` AND o.odds_maker = ${connection.escape(odds_maker)}`;
  }
  if (start_date) {
    query += ` AND m.tourney_date >= ${connection.escape(start_date)}`;
  }
  if (end_date) {
    query += ` AND m.tourney_date <= ${connection.escape(end_date)}`;
  }
  if (min_odds) {
    query += ` AND o.odds >= ${min_odds}`;
  }
  if (max_odds) {
    query += ` AND o.odds <= ${max_odds}`;
  }
  if (min_rank) {
    query += ` AND p.rank >= ${min_rank}`;
  }
  if (max_rank) {
    query += ` AND p.rank <= ${max_rank}`;
  }

  query += ' GROUP BY o.odds_maker';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Failed to retrieve odds maker analysis');
    }
    res.json(results);
  });
}

const synthetic_score = async function (req, res) {
  const { player_id, player_name, surface } = req.query;

    let query = `
    SELECT 
        p.player_id, p.name AS player_name, t.surface,
        SUM(m.w_1stWon + m.w_2ndWon - m.w_df) AS synthetic_score
    FROM Player p
    JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
    JOIN Tourney t ON m.tourney_id = t.tourney_id
    WHERE 1 = 1`;

    if (player_id) {
        query += ` AND p.player_id = ${connection.escape(player_id)}`;
    }
    if (player_name) {
        query += ` AND p.name LIKE ${connection.escape('%' + player_name + '%')}`;
    }
    if (surface) {
        query += ` AND t.surface = ${connection.escape(surface)}`;
    }

    query += ' GROUP BY p.player_id, t.surface';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Failed to retrieve synthetic score data');
        }
        res.json(results);
    });
}

// Route 5: Get PnL for a Vanilla Strategy
const vanilla_pnl = async function (req, res) {
  const { player_id } = req.query;

  if (!player_id) {
      return res.status(400).send('Player ID is required');
  }

  let query = `
  SELECT 
      p.player_id, p.name AS player_name,
      SUM(CASE WHEN m.winner_id = p.player_id THEN 1 ELSE 0 END) / COUNT(*) * 100 AS profit_loss
  FROM Player p
  JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
  WHERE p.player_id = ${connection.escape(player_id)}
  GROUP BY p.player_id`;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Failed to retrieve PnL data');
      }
      res.json(results);
  });
};

// Route 6: Paginated Data Table Queries
const paginated = async function (req, res) {
  const { player_id, name, hand, dob, ioc, height, is_atp, sort_column, sort_direction, limit_count, offset_count } = req.body;

  let query = `
  SELECT 
      p.player_id, p.name, p.hand, p.dob, p.ioc, p.height, p.is_atp
  FROM Player p
  WHERE 1 = 1`;

  if (player_id) {
      query += ` AND p.player_id = ${connection.escape(player_id)}`;
  }
  if (name) {
      query += ` AND p.name LIKE ${connection.escape('%' + name + '%')}`;
  }
  if (hand) {
      query += ` AND p.hand = ${connection.escape(hand)}`;
  }
  if (dob) {
      query += ` AND p.dob = ${connection.escape(dob)}`;
  }
  if (ioc) {
      query += ` AND p.ioc = ${connection.escape(ioc)}`;
  }
  if (height) {
      query += ` AND p.height = ${connection.escape(height)}`;
  }
  if (is_atp !== undefined) {
      query += ` AND p.is_atp = ${connection.escape(is_atp)}`;
  }

  if (sort_column && sort_direction) {
      query += ` ORDER BY ${connection.escapeId(sort_column)} ${connection.escape(sort_direction)}`;
  }

  if (limit_count) {
      query += ` LIMIT ${connection.escape(parseInt(limit_count, 10))}`;
  }

  if (offset_count) {
      query += ` OFFSET ${connection.escape(parseInt(offset_count, 10))}`;
  }

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Failed to retrieve paginated data');
      }
      res.json(results);
  });
};

// // Route 7: Find Underdog
const underdog = async function (req, res) {
  const { surface, tournament_id, tournament_level, is_atp } = req.query;

  let query = `
  SELECT 
      p.player_id, p.name AS player_name, COUNT(*) AS times_beat_the_odds
  FROM Player p
  JOIN Odds o ON p.player_id = o.player_id
  JOIN Tourney_Match m ON o.match_num = m.match_num AND o.tourney_id = m.tourney_id
  JOIN Tourney t ON m.tourney_id = t.tourney_id
  WHERE 1 = 1`;

  if (surface) {
      query += ` AND t.surface = ${connection.escape(surface)}`;
  }
  if (tournament_id) {
      query += ` AND t.tourney_id = ${connection.escape(tournament_id)}`;
  }
  if (tournament_level) {
      query += ` AND t.level = ${connection.escape(tournament_level)}`;
  }
  if (is_atp !== undefined) {
      query += ` AND p.is_atp = ${connection.escape(is_atp)}`;
  }

  query += `
  GROUP BY p.player_id
  ORDER BY times_beat_the_odds DESC`;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Failed to retrieve underdog data');
      }
      res.json(results);
  });
};

// // Route 8: Get PnL for a Factor-Based Strategy
const factor_strategy = async function (req, res) {
  const { fields, weights, year } = req.query;

  if (!fields || !weights || !year || fields.length !== weights.length) {
      return res.status(400).send('Invalid input data');
  }

  let selectFields = fields.map((field, index) => `SUM(${field} * ${weights[index]})`).join(' + ');

  let query = `
  SELECT 
      p.player_id, p.name AS player_name,
      (${selectFields}) AS synthetic_score,
      SUM(CASE WHEN m.tourney_date < ${year} THEN 1 ELSE 0 END) AS prior_matches,
      SUM(CASE WHEN m.tourney_date < ${year} AND m.winner_id = p.player_id THEN 1 ELSE 0 END) AS prior_wins
  FROM Player p
  JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
  WHERE m.tourney_date < ${connection.escape(year)}
  GROUP BY p.player_id
  HAVING prior_matches > 0
  ORDER BY synthetic_score DESC
  LIMIT 1`;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Failed to retrieve PnL data');
      }
      const bestPlayer = results[0];
      if (bestPlayer) {
          res.json({
              player_id: bestPlayer.player_id,
              player_name: bestPlayer.player_name,
              synthetic_score: bestPlayer.synthetic_score,
              profit_loss: (bestPlayer.prior_wins / bestPlayer.prior_matches) * 100
          });
      } else {
          res.status(404).send('No data available for the given year and conditions');
      }
  });
};

// // Route 9: Time Series Analysis of Player Performance
const time_series = async function (req, res) {
  const { player_id, surface, start_date, end_date, seasonality } = req.query;

  let groupByPeriod;
  if (seasonality === 'monthly') {
      groupByPeriod = "DATE_FORMAT(m.match_date, '%Y-%m')";
  } else if (seasonality === 'yearly') {
      groupByPeriod = "YEAR(m.match_date)";
  } else {
      groupByPeriod = "DATE_FORMAT(m.match_date, '%Y-%m-%d')";
  }

  let query = `
  SELECT 
      p.player_id, p.name AS player_name, t.surface,
      ${groupByPeriod} AS period,
      COUNT(*) AS total_matches,
      SUM(CASE WHEN m.winner_id = p.player_id THEN 1 ELSE 0 END) AS matches_won,
      AVG(m.w_ace) AS avg_aces,
      AVG(m.w_df) AS avg_double_faults
  FROM Player p
  JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
  JOIN Tourney t ON m.tourney_id = t.tourney_id
  WHERE 1 = 1`;

  if (player_id) {
      query += ` AND p.player_id = ${connection.escape(player_id)}`;
  }
  if (surface) {
      query += ` AND t.surface = ${connection.escape(surface)}`;
  }
  if (start_date) {
      query += ` AND m.match_date >= ${connection.escape(start_date)}`;
  }
  if (end_date) {
      query += ` AND m.match_date <= ${connection.escape(end_date)}`;
  }

  query += ` GROUP BY p.player_id, t.surface, period ORDER BY period ASC`;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send('Failed to retrieve time series analysis');
      }
      res.json(results);
  });
};


module.exports = {
  streaks,
  performance_by_surface,
  analysis,
  synthetic_score,
  vanilla_pnl,
  paginated,
  underdog,
  factor_strategy,
  time_series
}
