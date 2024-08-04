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
    const { paginationModel, filterModel, sortModel } = req.query;
    
    let page = 0;
    let pageSize = 25;
    if (paginationModel) {
      const parsedPaginationModel = JSON.parse(paginationModel);
      page = parsedPaginationModel.page || 0;
      pageSize = parsedPaginationModel.pageSize || 25;
    }
    
    const offset = page * pageSize;
  
    let whereClause = 'WHERE name IS NOT NULL AND dob IS NOT NULL';
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
      FROM Player
      ${whereClause}
    `;
  
    const dataQuery = `
      SELECT 
        player_id,
        name,
        hand,
        DATE_FORMAT(dob, '%m-%d-%Y') AS dob,
        ioc,
        height,
        is_atp
      FROM Player
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
  

module.exports = {
    all_players,
    all_tourneys
}