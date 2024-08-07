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

  const all_players = async function (req, res) {
    const { paginationModel, filterModel, sortModel, includeHistorical } = req.query;
    let page = 0;
    let pageSize = 25;
    if (paginationModel) {
      const parsedPaginationModel = JSON.parse(paginationModel);
      page = parsedPaginationModel.page || 0;
      pageSize = parsedPaginationModel.pageSize || 25;
    }
    const offset = page * pageSize;
  
    let whereClause = 'WHERE Player.name IS NOT NULL AND Player.dob IS NOT NULL';
    let queryParams = [];
  
    if (filterModel) {
      const parsedFilterModel = JSON.parse(filterModel);
      if (parsedFilterModel.items) {
        parsedFilterModel.items.forEach(filter => {
          if (filter.value && filter.value.toString().trim() !== '') {
            whereClause += ` AND Player.${filter.field} LIKE ?`;
            queryParams.push(`%${filter.value}%`);
          }
        });
      }
    }
  
    let orderClause = '';
    if (sortModel) {
      const parsedSortModel = JSON.parse(sortModel);
      if (parsedSortModel.length > 0) {
        orderClause = 'ORDER BY ' + parsedSortModel.map(sort => `Player.${sort.field} ${sort.sort}`).join(', ');
      }
    }
  
    let joinClause = '';
    if (includeHistorical !== 'true') {
      joinClause = `
        INNER JOIN (
          SELECT winner_id as player_id FROM Tourney_Match
          UNION
          SELECT loser_id as player_id FROM Tourney_Match
        ) as PlayerMatches ON Player.player_id = PlayerMatches.player_id
      `;
    }
  
    const countQuery = `
      SELECT COUNT(DISTINCT Player.player_id) as total
      FROM Player
      ${joinClause}
      ${whereClause}
    `;
  
    const dataQuery = `
      SELECT DISTINCT
        Player.player_id,
        Player.name,
        Player.hand,
        DATE_FORMAT(Player.dob, '%m-%d-%Y') AS dob,
        Player.ioc,
        Player.height,
        Player.is_atp,
        CASE WHEN PlayerMatches.player_id IS NULL THEN TRUE ELSE FALSE END as is_historical
      FROM Player
      LEFT JOIN (
        SELECT winner_id as player_id FROM Tourney_Match
        UNION
        SELECT loser_id as player_id FROM Tourney_Match
      ) as PlayerMatches ON Player.player_id = PlayerMatches.player_id
      ${whereClause}
      ${includeHistorical !== 'true' ? 'HAVING is_historical = FALSE' : ''}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
  
    queryParams.push(pageSize, offset);
  
    connection.query(countQuery, queryParams.slice(0, -2), (countErr, countResults) => {
      if (countErr) {
        console.error('Database query error:', countErr);
        return res.status(500).send('Failed to retrieve player count');
      }
      const total = countResults[0].total;
  
      connection.query(dataQuery, queryParams, (dataErr, dataResults) => {
        if (dataErr) {
          console.error('Database query error:', dataErr);
          return res.status(500).send('Failed to retrieve player data');
        }
        res.json({
          players: dataResults,
          total: total
        });
      });
    });
  }
  
  const all_tourneys = async function (req, res) {
    const { paginationModel, filterModel, sortModel } = req.query;
    
    let page = 0;
    let pageSize = 25;
    if (paginationModel) {
      const parsedPaginationModel = JSON.parse(paginationModel);
      page = parsedPaginationModel.page || 0;
      pageSize = parsedPaginationModel.pageSize || 25;
    }
    
    const offset = page * pageSize;
  
    let whereClause = 'WHERE tourney_name IS NOT NULL';
    let queryParams = [];
  
    if (filterModel) {
      const parsedFilterModel = JSON.parse(filterModel);
      if (parsedFilterModel.items) {
        parsedFilterModel.items.forEach(filter => {
          if (filter.value && filter.value.toString().trim() !== '') {
            whereClause += ` AND ${filter.field} LIKE ?`;
            queryParams.push(`%${filter.value}%`);
          }
        });
      }
    }
  
    let orderClause = '';
    if (sortModel) {
      const parsedSortModel = JSON.parse(sortModel);
      if (parsedSortModel.length > 0) {
        orderClause = 'ORDER BY ' + parsedSortModel.map(sort => `${sort.field} ${sort.sort}`).join(', ');
      }
    }
  
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Tourney
      ${whereClause}
    `;
  
    const dataQuery = `
      SELECT 
        tourney_id as id,
        tourney_name,
        surface,
        num_match,
        tourney_level,
        best_of
      FROM Tourney
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
  
    queryParams.push(pageSize, offset);
  
    connection.query(countQuery, queryParams.slice(0, -2), (countErr, countResults) => {
      if (countErr) {
        console.error('Database query error:', countErr);
        return res.status(500).send('Failed to retrieve player count');
      }
  
      const total = countResults[0].total;
  
      connection.query(dataQuery, queryParams, (dataErr, dataResults) => {
        if (dataErr) {
          console.error('Database query error:', dataErr);
          return res.status(500).send('Failed to retrieve player data');
        }
  
        res.json({
          players: dataResults,
          total: total
        });
      });
    });
  }
  
  const all_matches = async function (req, res) {
    const { paginationModel, filterModel, sortModel } = req.query;
    let page = 0;
    let pageSize = 25;
    if (paginationModel) {
      const parsedPaginationModel = JSON.parse(paginationModel);
      page = parsedPaginationModel.page || 0;
      pageSize = parsedPaginationModel.pageSize || 25;
    }
    const offset = page * pageSize;
  
    let whereClause = 'WHERE 1=1'; // This will always be true, allowing us to add more conditions easily
    let queryParams = [];
  
    if (filterModel) {
      const parsedFilterModel = JSON.parse(filterModel);
      if (parsedFilterModel.items) {
        parsedFilterModel.items.forEach(filter => {
          if (filter.value && filter.value.toString().trim() !== '') {
            whereClause += ` AND ${filter.field} LIKE ?`;
            queryParams.push(`%${filter.value}%`);
          }
        });
      }
    }
  
    let orderClause = '';
    if (sortModel) {
      const parsedSortModel = JSON.parse(sortModel);
      if (parsedSortModel.length > 0) {
        orderClause = 'ORDER BY ' + parsedSortModel.map(sort => `${sort.field} ${sort.sort}`).join(', ');
      }
    }
  
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Tourney_Match
      ${whereClause}
    `;
  
    const dataQuery = `
      SELECT
        winner_name,
        winner_rank,
        loser_name,
        loser_rank,
        score,
        tourney_name,
        DATE_FORMAT(tourney_date, '%m-%d-%Y') AS tourney_date,
        minutes,
        w_ace AS winner_aces,
        l_ace AS loser_aces,
        w_df AS winner_double_faults,
        l_df AS loser_double_faults
      FROM Tourney_Match
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
  
    queryParams.push(pageSize, offset);
  
    connection.query(countQuery, queryParams.slice(0, -2), (countErr, countResults) => {
      if (countErr) {
        console.error('Database query error:', countErr);
        return res.status(500).send('Failed to retrieve match count');
      }
      const total = countResults[0].total;
  
      connection.query(dataQuery, queryParams, (dataErr, dataResults) => {
        if (dataErr) {
          console.error('Database query error:', dataErr);
          return res.status(500).send('Failed to retrieve match data');
        }
        res.json({
          matches: dataResults,
          total: total
        });
      });
    });
  }

module.exports = {
    all_players,
    all_tourneys,
    all_matches
}