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
  const { player_id, player_name, streak_length = 3, streak_type, start_date, end_date } = req.query;

  let query = `
      WITH MatchResults AS (
          SELECT match_num, tourney_id, tourney_date, winner_id AS player_id, 'W' AS result
          FROM Tourney_Match
          UNION ALL
          SELECT match_num, tourney_id, tourney_date, loser_id AS player_id, 'L' AS result
          FROM Tourney_Match
      ),
      RankedResults AS (
          SELECT player_id, tourney_date, result,
                 ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY tourney_date) AS seq,
                 LAG(result) OVER (PARTITION BY player_id ORDER BY tourney_date) AS prev_result
          FROM MatchResults
      ),
      Streaks AS (
          SELECT player_id, tourney_date, result, seq,
                 (CASE WHEN result = LAG(result) OVER (PARTITION BY player_id ORDER BY seq) THEN 0 ELSE 1 END) AS streak_start
          FROM RankedResults
      ),
      StreakGroups AS (
          SELECT player_id, tourney_date, result,
                 SUM(streak_start) OVER (PARTITION BY player_id ORDER BY seq) AS streak_id
          FROM Streaks
      ),
      PlayerStreaks AS (
          SELECT player_id, result, MIN(tourney_date) AS start_date, MAX(tourney_date) AS end_date, COUNT(*) AS streak_length
          FROM StreakGroups
          GROUP BY player_id, result, streak_id
      )
      SELECT pls.player_id, pl.name as player_name, pls.result as streak_type, pls.streak_length, pls.start_date, pls.end_date
      FROM PlayerStreaks pls
      LEFT JOIN Player pl ON pl.player_id = pls.player_id
      WHERE pls.streak_length >= ?
  `;

  const values = [streak_length];

  if (player_id) {
    query += ` AND pls.player_id = ?`;
    values.push(player_id);
  }

  if (player_name) {
    query += ` AND pl.name LIKE ?`;
    values.push(`%${player_name}%`);
  }

  if (streak_type) {
    query += ` AND pls.result = ?`;
    values.push(streak_type);
  }

  if (start_date) {
    query += ` AND pls.start_date >= ?`;
    values.push(start_date);
  }

  if (end_date) {
    query += ` AND pls.end_date <= ?`;
    values.push(end_date);
  }

  query += ` ORDER BY pls.streak_length DESC`;

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error executing query', error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
};

const performance_by_surface = async function (req, res) {
  const { player_id, player_name, surface, min_matches=10, start_date, end_date } = req.query;

  let query = `
  SELECT 
    p.player_id, p.name, t.surface,
    COUNT(*) AS total_matches,
    SUM(CASE WHEN m.winner_id = p.player_id THEN 1 ELSE 0 END) AS matches_won,
    AVG(m.w_ace) AS avg_aces,
    AVG(m.w_df) AS avg_double_faults,
    AVG(m.w_1stIn) AS avg_first_serves_in,
    (SUM(CASE WHEN m.winner_id = p.player_id THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS win_loss_percentage
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

  if (min_matches) {
    query += ` HAVING COUNT(*) >= ${connection.escape(parseInt(min_matches, 10))}`;
  }

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
  const { player_id, player_name, surface, min_matches = 10 } = req.query;
    console.log('executing synthetic_score');

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

    if (min_matches) {
      query += ` HAVING COUNT(*) >= ${connection.escape(parseInt(min_matches, 10))}`;
    }

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

// Route 7a: Find Underdog
const underdog = async function (req, res) {
  const { surface, tournament_id, tournament_level, is_atp, player_id } = req.query;
  let query = `
  SELECT
      p.player_id, 
      p.name AS player_name, 
      COUNT(*) AS times_beat_the_odds,
      COUNT(*) / (
          SELECT COUNT(*)
          FROM Odds o2
          JOIN Tourney_Match m2 ON o2.match_num = m2.match_num AND o2.tourney_id = m2.tourney_id
          WHERE o2.player_id = p.player_id AND o2.odds > 2
      ) * 100 AS underdog_win_percentage
  FROM Player p
  JOIN Odds o ON p.player_id = o.player_id
  JOIN Tourney_Match m ON o.match_num = m.match_num AND o.tourney_id = m.tourney_id
  JOIN Tourney t ON m.tourney_id = t.tourney_id
  WHERE o.odds > 2 AND m.winner_id = p.player_id`;

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
  if (player_id) {
      const playerIds = Array.isArray(player_id) ? player_id : [player_id];
      query += ` AND p.player_id IN (${playerIds.map(id => connection.escape(id)).join(',')})`;
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

// Route 7b: Find Worst Favorite
const worstFavorite = async function (req, res) {
  const { surface, tournament_id, tournament_level, is_atp, player_id } = req.query;
  let query = `
    WITH FavoriteLosses AS (
      SELECT
        p.player_id,
        p.name AS player_name,
        COUNT(*) AS times_lost_as_favorite,
        COUNT(*) / (
          SELECT COUNT(*)
          FROM Odds o2
          JOIN Tourney_Match m2 ON o2.match_num = m2.match_num AND o2.tourney_id = m2.tourney_id
          WHERE o2.player_id = p.player_id AND o2.odds <= 2
        ) * 100 AS favorite_loss_percentage
      FROM Player p
      JOIN Odds o ON p.player_id = o.player_id
      JOIN Tourney_Match m ON o.match_num = m.match_num AND o.tourney_id = m.tourney_id
      JOIN Tourney t ON m.tourney_id = t.tourney_id
      WHERE o.odds <= 2 AND m.winner_id != p.player_id`;

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
  if (player_id) {
    const playerIds = Array.isArray(player_id) ? player_id : [player_id];
    query += ` AND p.player_id IN (${playerIds.map(id => connection.escape(id)).join(',')})`;
  }

  query += `
      GROUP BY p.player_id, p.name
    )
    SELECT *
    FROM FavoriteLosses
    WHERE times_lost_as_favorite > 3
    ORDER BY favorite_loss_percentage DESC`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Failed to retrieve worst favorite data');
    }
    res.json(results);
  });
};

// // Route 8: Get PnL for a Factor-Based Strategy
//  //valid fields: ace, df, svpt, 1stIn,1stWon,2ndWon,SvGms,bpSaved,bpFaced,
const factor_strategy = async function (req, res) {
  const { fields, weights, year } = req.query;
  
  if (!fields || !weights || !year) {
    return res.status(400).send('Invalid input data');
  }

  const fieldsArray = fields.split(',');
  const weightsArray = weights.split(',').map(Number);

  if (fieldsArray.length !== weightsArray.length) {
    return res.status(400).send('Fields and weights must have the same length');
  }

  // Map input fields to database column names
  const fieldMapping = {
    'ace': 'ace',
    'df': 'df',
    'svpt': 'svpt',
    '1stIn': '1stIn',
    '1stWon': '1stWon',
    '2ndWon': '2ndWon',
    'SvGms': 'SvGms',
    'bpSaved': 'bpSaved',
    'bpFaced': 'bpFaced',
    '1st_serve_won': '1stWon',
    '2nd_serve_won': '2ndWon',
    'double_faults': 'df'
  };

  // Map and validate fields
  const mappedFields = fieldsArray.map(field => {
    const mappedField = fieldMapping[field];
    if (mappedField === undefined) {
      console.warn(`Warning: Unknown field "${field}" - skipping`);
      return null;
    }
    return mappedField;
  }).filter(field => field !== null);

  if (mappedFields.length === 0) {
    return res.status(400).send('No valid fields provided');
  }

  // Construct the winner and loser columns
  const winnerColumns = mappedFields.map(field => `w_${field}`);
  const loserColumns = mappedFields.map(field => `l_${field}`);

  // Construct the weighted sum expressions
  const winnerSelectFields = winnerColumns.map((field, index) => `${field} * ${weightsArray[index]}`).join(' + ');
  const loserSelectFields = loserColumns.map((field, index) => `${field} * ${weightsArray[index]}`).join(' + ');

  const queries = [
    `CREATE OR REPLACE VIEW Match_Synthetic_Scores AS
    SELECT
      tourney_id,
      match_num,
      tourney_date,
      winner_id AS player_id,
      (${winnerSelectFields}) AS synthetic_score,
      1 AS is_winner
    FROM
      ServeIt.Tourney_Match
    UNION ALL
    SELECT
      tourney_id,
      match_num,
      tourney_date,
      loser_id AS player_id,
      (${loserSelectFields}) AS synthetic_score,
      0 AS is_winner
    FROM
      ServeIt.Tourney_Match`,

    `CREATE OR REPLACE VIEW Accumulated_Scores AS
    SELECT
      player_id,
      SUM(synthetic_score) AS accumulated_score
    FROM
      Match_Synthetic_Scores
    WHERE
      YEAR(tourney_date) < ?
    GROUP BY
      player_id`,

    `CREATE OR REPLACE VIEW Betting_Strategy AS
    SELECT
      m.tourney_id,
      m.match_num,
      m.tourney_date,
      m.winner_id,
      m.loser_id,
      CASE
        WHEN p1.accumulated_score > p2.accumulated_score THEN m.winner_id
        ELSE m.loser_id
      END AS bet_on_player
    FROM
      ServeIt.Tourney_Match m
      JOIN Accumulated_Scores p1 ON m.winner_id = p1.player_id
      JOIN Accumulated_Scores p2 ON m.loser_id = p2.player_id
    WHERE
      YEAR(m.tourney_date) >= ?`,

    `CREATE OR REPLACE VIEW PnL_Calculation AS
    SELECT
      bs.tourney_id,
      bs.match_num,
      bs.tourney_date,
      bs.bet_on_player,
      tm.winner_id,
      o.odds,
      CASE
        WHEN bs.bet_on_player = tm.winner_id THEN o.odds
        ELSE -1
      END AS pnl
    FROM
      Betting_Strategy bs
      JOIN ServeIt.Tourney_Match tm ON bs.tourney_id = tm.tourney_id AND bs.match_num = tm.match_num
      JOIN ServeIt.Odds o ON bs.tourney_id = o.tourney_id AND bs.match_num = o.match_num AND bs.bet_on_player = o.player_id
    WHERE
      YEAR(bs.tourney_date) >= ?`,

    `SELECT SUM(pnl) AS total_pnl FROM PnL_Calculation`
  ];

  try {
    for (let i = 0; i < queries.length - 1; i++) {
      await new Promise((resolve, reject) => {
        connection.query(queries[i], [year], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    const [results] = await new Promise((resolve, reject) => {
      connection.query(queries[queries.length - 1], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (results && results.total_pnl !== undefined) {
      res.json({
        profit_loss: results.total_pnl
      });
    } else {
      res.status(404).send('No data available for the given year and conditions');
    }
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).send('Failed to retrieve PnL data');
  }
};

// // Route 9: Time Series Analysis of Player Performance
const time_series = async function (req, res) {
  const { player_name, surface, start_date, end_date, seasonality } = req.query;
  let groupByPeriod;
  if (seasonality === 'monthly') {
    groupByPeriod = "DATE_FORMAT(tm.tourney_date, '%Y-%m')";
  } else if (seasonality === 'yearly') {
    groupByPeriod = "YEAR(tm.tourney_date)";
  } else {
    groupByPeriod = "DATE_FORMAT(tm.tourney_date, '%Y-%m-%d')";
  }
  
  let query = `
  WITH player_subquery AS (
    SELECT player_id
    FROM Player
    WHERE name LIKE ${connection.escape(`%${player_name}%`)}
  )
  SELECT
    p.player_id,
    p.name,
    ${groupByPeriod} AS period,
    t.surface,
    AVG(CASE WHEN tm.winner_id = p.player_id THEN w_ace ELSE l_ace END) AS avg_aces,
    AVG(CASE WHEN tm.winner_id = p.player_id THEN w_df ELSE l_df END) AS avg_double_faults,
    SUM(CASE WHEN tm.winner_id = p.player_id THEN 1 ELSE 0 END) AS matches_won,
    COUNT(*) AS total_matches_played
  FROM
    Tourney_Match tm
  JOIN
    Player p ON p.player_id IN (tm.winner_id, tm.loser_id)
  JOIN
    Tourney t ON tm.tourney_id = t.tourney_id
  WHERE 1 = 1`;

  if (player_name) {
    query += ` AND p.player_id IN (SELECT player_id FROM player_subquery)`;
  }
  if (surface) {
    query += ` AND t.surface = ${connection.escape(surface)}`;
  }
  if (start_date) {
    query += ` AND tm.tourney_date >= ${connection.escape(start_date)}`;
  }
  if (end_date) {
    query += ` AND tm.tourney_date <= ${connection.escape(end_date)}`;
  }
  query += ` GROUP BY p.player_id, p.name, t.surface, period ORDER BY period ASC`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Failed to retrieve time series analysis');
    }
    res.json(results);
  });
};

const searchPlayers = async function (req, res) {
  console.log('searchPlayers');
  const { term } = req.query;
  let query = `
    SELECT player_id, name
    FROM Player
    WHERE name LIKE ?
    LIMIT 10
  `;
  connection.query(query, [`%${term}%`], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send('Failed to search players');
    }
    res.json(results);
  });
}

module.exports = {
  streaks,
  performance_by_surface,
  analysis,
  synthetic_score,
  vanilla_pnl,
  paginated,
  underdog,
  worstFavorite,
  factor_strategy,
  time_series,
  searchPlayers
}
