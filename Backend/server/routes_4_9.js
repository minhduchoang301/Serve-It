// Required libraries and setup
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

// Routes 1,2,3.

// Route 4: Get Synthetic Score
app.get('/api/odds/synthetic_score', (req, res) => {
    const { player_id, player_name, surface } = req.query;

    let query = `
    SELECT 
        p.player_id, p.name AS player_name, t.surface,
        SUM(m.first_serves_in + m.second_serves_in - m.double_faults) AS synthetic_score
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
});

// Route 5: Find Underdog
app.get('/api/odds/underdog', (req, res) => {
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
});

// Route 6: Get PnL for a Factor-Based Strategy
app.get('/api/odds/factor_strategy', (req, res) => {
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
});

// Route 7: Time Series Analysis of Player Performance
app.get('/api/players/time-series-analysis', (req, res) => {
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
});

// Additional Routes (8 and 9)

// Route 8: Get PnL for a Vanilla Strategy
app.get('/api/odds/vanilla_pnl', (req, res) => {
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
});

// Route 9: Paginated Data Table Queries
app.get('/api/players/paginated', (req, res) => {
    const { player_id, name, hand, dob, ioc, height, is_atp, sort_column, sort_direction, limit_count, offset_count } = req.query;

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
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
