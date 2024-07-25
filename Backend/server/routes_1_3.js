const mysql = require('mysql');
const express = require('express');
const app = express();
const port = 3000;

const dbConfig = {
    host: 'database-2.c904gqqk6wl6.us-east-2.rds.amazonaws.com',
    user: 'serveit',
    password: 'serveit2024',
    port: 3306,
    database: 'ServeIt'
};

const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
    if (err) {
        return console.error('Error connecting to the database: ' + err.message);
    }
    console.log('Connected to the MySQL server.');
});

app.use(express.json());

app.get('/api/players/streaks', (req, res) => {
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
    } = req.query;

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
});

app.get('/api/players/performance-by-surface', (req, res) => {
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
});

app.get('/api/odds/analysis', (req, res) => {
    const { odds_maker, start_date, end_date, min_odds, max_odds, min_rank, max_rank } = req.query;

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
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
