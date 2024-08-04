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

  const getPlayerData = (req, res) => {
    const { player_id } = req.query;
    
    if (!player_id) {
      return res.status(400).send('Player ID is required');
    }
  
    // Convert player_id to integer
    const playerId = parseInt(player_id, 10);

    // 0. Get player name and country
    let playerInfoQuery = `
        SELECT
            p.player_id,
            p.name,
            p.ioc as country,
            p.hand,
            DATE_FORMAT(dob, '%m-%d-%Y') as dob,
            p.height,
            p.is_atp
        FROM Player p
        WHERE p.player_id = ${playerId}`;
    connection.query(playerInfoQuery, (err, playerInfo) => {
        if (err) {
            console.error('Player info query error:', err);
            return res.status(500).send('Failed to retrieve player info');
        }
  
    // 1. Rank History
    let rankHistoryQuery = `
      SELECT 
        DATE_FORMAT(m.tourney_date, '%m-%d-%Y') AS match_date,
        CASE 
          WHEN m.winner_id = ${playerId} THEN m.winner_rank 
          ELSE m.loser_rank 
        END AS player_rank,
        CASE
            WHEN m.winner_id = ${playerId} THEN m.winner_rank_points
            ELSE m.loser_rank_points
        END AS player_rank_points,
        CASE
            WHEN m.winner_id = ${playerId} THEN 1
            ELSE 0
        END AS win
      FROM 
        Tourney_Match m 
      WHERE 
        m.winner_id = ${playerId} OR m.loser_id = ${playerId} 
      ORDER BY 
        m.tourney_date`;
    connection.query(rankHistoryQuery, (err, rankHistory) => {
      if (err) {
        console.error('Rank history query error:', err);
        return res.status(500).send('Failed to retrieve rank history data');
      }
  
      // 2. Matches Played, Wins, Losses
      let matchesQuery = `
        SELECT 
          COUNT(*) AS matches_played,
          SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) AS wins,
          SUM(CASE WHEN m.loser_id = ${playerId} THEN 1 ELSE 0 END) AS losses
        FROM Tourney_Match m
        WHERE m.winner_id = ${playerId} OR m.loser_id = ${playerId}`;
      connection.query(matchesQuery, (err, matches) => {
        if (err) {
          console.error('Matches played, wins, losses query error:', err);
          return res.status(500).send('Failed to retrieve matches data');
        }
  
        // 3. Performance by Surface
        let surfaceQuery = `
          SELECT 
            t.surface,
            SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN m.loser_id = ${playerId} THEN 1 ELSE 0 END) AS losses
          FROM Tourney t
          JOIN Tourney_Match m ON t.tourney_id = m.tourney_id
          WHERE m.winner_id = ${playerId} OR m.loser_id = ${playerId}
          GROUP BY t.surface`;
        connection.query(surfaceQuery, (err, surfacePerformance) => {
          if (err) {
            console.error('Performance by surface query error:', err);
            return res.status(500).send('Failed to retrieve surface performance data');
          }
  
            // 4. Opponent Performance
          let opponentQuery = `
            SELECT 
              p.name AS opponent,
              SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) AS wins_against,
              SUM(CASE WHEN m.loser_id = ${playerId} THEN 1 ELSE 0 END) AS losses_against,
              COUNT(*) AS matches_played,
              SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) / COUNT(*) AS win_loss_ratio
            FROM Player p
            JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
            WHERE (m.winner_id = ${playerId} AND m.loser_id = p.player_id) 
              OR (m.loser_id = ${playerId} AND m.winner_id = p.player_id)
            GROUP BY p.name
            HAVING matches_played >= 3
            ORDER BY win_loss_ratio DESC, matches_played DESC
            LIMIT 1`;
          connection.query(opponentQuery, (err, bestOpponent) => {
            if (err) {
              console.error('Best opponent query error:', err);
              return res.status(500).send('Failed to retrieve best opponent data');
            }

            let worstOpponentQuery = `
              SELECT 
                p.name AS opponent,
                SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) AS wins_against,
                SUM(CASE WHEN m.loser_id = ${playerId} THEN 1 ELSE 0 END) AS losses_against,
                COUNT(*) AS matches_played,
                SUM(CASE WHEN m.winner_id = ${playerId} THEN 1 ELSE 0 END) / COUNT(*) AS win_loss_ratio
              FROM Player p
              JOIN Tourney_Match m ON p.player_id = m.winner_id OR p.player_id = m.loser_id
              WHERE (m.winner_id = ${playerId} AND m.loser_id = p.player_id) 
                OR (m.loser_id = ${playerId} AND m.winner_id = p.player_id)
              GROUP BY p.name
              HAVING matches_played >= 3
              ORDER BY win_loss_ratio ASC, matches_played DESC
              LIMIT 1`;
            connection.query(worstOpponentQuery, (err, worstOpponent) => {
              if (err) {
                console.error('Worst opponent query error:', err);
                return res.status(500).send('Failed to retrieve worst opponent data');
              }
  
              // 5. Win and Loss Streaks
            let streakQuery = `
              SELECT 
                m.tourney_date AS match_date,
                CASE 
                  WHEN m.winner_id = ${playerId} THEN 'win'
                  ELSE 'loss'
                END AS result
              FROM Tourney_Match m
              WHERE m.winner_id = ${playerId} OR m.loser_id = ${playerId}
              ORDER BY m.tourney_date`;
            connection.query(streakQuery, (err, matches) => {
              if (err) {
                console.error('Win and loss streaks query error:', err);
                return res.status(500).send('Failed to retrieve win and loss streaks data');
              }

              // Calculate streaks
              let maxWinStreak = 0;
              let maxLossStreak = 0;
              let currentWinStreak = 0;
              let currentLossStreak = 0;

              matches.forEach(match => {
                if (match.result === 'win') {
                  currentWinStreak += 1;
                  currentLossStreak = 0;
                } else {
                  currentLossStreak += 1;
                  currentWinStreak = 0;
                }
                if (currentWinStreak > maxWinStreak) {
                  maxWinStreak = currentWinStreak;
                }
                if (currentLossStreak > maxLossStreak) {
                  maxLossStreak = currentLossStreak;
                }
              });

              // Extract highest and current rank and points from rankHistory
              const highestRank = Math.min(...rankHistory.map(r => r.player_rank));
              const currentRank = rankHistory[rankHistory.length - 1]?.player_rank || null;
              const highestRankPoints = Math.max(...rankHistory.map(r => r.player_rank_points));
              const currentRankPoints = rankHistory[rankHistory.length - 1]?.player_rank_points || null;

              // Combine all results
              const playerData = {
                playerInfo,
                rankHistory,
                matchesPlayed: matches.length,
                wins: matches.filter(match => match.result === 'win').length,
                losses: matches.filter(match => match.result === 'loss').length,
                surfacePerformance,
                highestRank,
                currentRank,
                highestRankPoints,
                currentRankPoints,
                bestOpponent: bestOpponent[0],
                worstOpponent: worstOpponent[0],
                longestWinStreak: maxWinStreak,
                longestLossStreak: maxLossStreak,
              };
  
                res.json(playerData);
              });
            });
          });
        });
      });
    });
  });
};
module.exports = { getPlayerData };