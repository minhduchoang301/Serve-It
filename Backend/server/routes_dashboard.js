// Gets player information used by the player profile page
const mysql = require('mysql')
const config = require('./config.json')

const connection = mysql.createConnection({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db
  });
  connection.connect((err) => err && console.log(err));

  const getTopPlayers = async function (req, res) {
    console.log('getTopPlayers');
    const { startYear, endYear } = req.query;
    // Ensure startYear and endYear are numbers
    const start = parseInt(startYear) || 2017;  // default to 2000 if not provided
    const end = parseInt(endYear) || new Date().getFullYear();  // default to current year if not provided
    
    let query = `
      WITH RankedPlayers AS (
        SELECT 
          YEAR(m.tourney_date) AS year,
          p.player_id,
          p.name,
          MIN(IF(m.winner_id = p.player_id, m.winner_rank, m.loser_rank)) AS best_rank,
          ROW_NUMBER() OVER (PARTITION BY YEAR(m.tourney_date) ORDER BY MIN(IF(m.winner_id = p.player_id, m.winner_rank, m.loser_rank))) AS rank_order
        FROM 
          Tourney_Match m
        JOIN Player p ON p.player_id IN (m.winner_id, m.loser_id)
        WHERE 
          YEAR(m.tourney_date) BETWEEN ? AND ?
          AND (
            (m.winner_id = p.player_id AND m.winner_rank <= 10)
            OR 
            (m.loser_id = p.player_id AND m.loser_rank <= 10)
          )
        GROUP BY 
          YEAR(m.tourney_date), p.player_id, p.name
      )
      SELECT 
        year,
        MAX(IF(rank_order = 1, name, NULL)) AS rank1,
        MAX(IF(rank_order = 2, name, NULL)) AS rank2,
        MAX(IF(rank_order = 3, name, NULL)) AS rank3,
        MAX(IF(rank_order = 4, name, NULL)) AS rank4,
        MAX(IF(rank_order = 5, name, NULL)) AS rank5,
        MAX(IF(rank_order = 6, name, NULL)) AS rank6,
        MAX(IF(rank_order = 7, name, NULL)) AS rank7,
        MAX(IF(rank_order = 8, name, NULL)) AS rank8,
        MAX(IF(rank_order = 9, name, NULL)) AS rank9,
        MAX(IF(rank_order = 10, name, NULL)) AS rank10
      FROM RankedPlayers
      WHERE rank_order <= 10
      GROUP BY year
      ORDER BY year DESC
    `;
  
    connection.query(query, [start, end], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Failed to retrieve top players');
      }
      res.json(results);
    });
  }

  const getRandomPlayer = async function (req, res) {
    console.log('getRandomPlayer');
    let query = `
      SELECT player_id
      FROM (
        SELECT winner_id AS player_id
        FROM Tourney_Match
        UNION ALL
        SELECT loser_id AS player_id
        FROM Tourney_Match
      ) AS AllPlayers
      GROUP BY player_id
      HAVING COUNT(*) >= 10
      ORDER BY RAND()
      LIMIT 1
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Failed to retrieve random player');
      }
      res.json(results[0]);
    });
  }


module.exports = {
    getTopPlayers,
    getRandomPlayer
}