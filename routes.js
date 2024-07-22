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

// Route 1: GET /author/:type
const author = async function(req, res) {
  // TODO (TASK 1): replace the values of name and pennKey with your own
  const name = 'Minh Duc Hoang';
  const pennKey = 'duchoang';

  // checks the value of type the request parameters
  // note that parameters are required and are specified in server.js in the endpoint by a colon (e.g. /author/:type)
  if (req.params.type === 'name') {
    // res.send returns data back to the requester via an HTTP response
    res.send(`Created by ${name}`);
  } else if (req.params.type === 'pennkey') {
    // TODO (TASK 2): edit the else if condition to check if the request parameter is 'pennkey' and if so, send back response 'Created by [pennkey]'
    res.send(`Created by ${pennKey}`);
  } else {
    // we can also send back an HTTP status code to indicate an improper request
    res.status(400).send(`'${req.params.type}' is not a valid author type. Valid types are 'name' and 'pennkey'.`);
  }
}

// Route 2: GET /random
const random = async function(req, res) {
  // you can use a ternary operator to check the value of request query values
  // which can be particularly useful for setting the default value of queries
  // note if users do not provide a value for the query it will be undefined, which is falsey
  const explicit = req.query.explicit === 'true' ? 1 : 0;

  // Here is a complete example of how to query the database in JavaScript.
  // Only a small change (unrelated to querying) is required for TASK 3 in this route.
  connection.query(`
    SELECT *
    FROM Songs
    WHERE explicit <= ${explicit}
    ORDER BY RAND()
    LIMIT 1
  `, (err, data) => {
    if (err || data.length === 0) {
      // If there is an error for some reason, or if the query is empty (this should not be possible)
      // print the error message and return an empty object instead
      console.log(err);
      // Be cognizant of the fact we return an empty object {}. For future routes, depending on the
      // return type you may need to return an empty array [] instead.
      res.json({});
    } else {
      // Here, we return results of the query as an object, keeping only relevant data
      // being song_id and title which you will add. In this case, there is only one song
      // so we just directly access the first element of the query results array (data)
      // TODO (TASK 3): also return the song title in the response
      res.json({
        song_id: data[0].song_id,
        title: data[0].title
      });
    }
  });
}

/********************************
 * BASIC SONG/ALBUM INFO ROUTES *
 ********************************/

// Route 3: GET /song/:song_id
const song = async function(req, res) {
  // TODO (TASK 4): implement a route that given a song_id, returns all information about the song
  // Hint: unlike route 2, you can directly SELECT * and just return data[0]
  // Most of the code is already written for you, you just need to fill in the query
  const song_id = req.params.song_id
  connection.query(`SELECT * FROM Songs WHERE song_id = "${song_id}"`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 4: GET /album/:album_id
const album = async function(req, res) {
  // TODO (TASK 5): implement a route that given a album_id, returns all information about the album
  connection.query(`SELECT * FROM Albums WHERE album_id = "${req.params.album_id}"`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 5: GET /albums
const albums = async function(req, res) {
  // TODO (TASK 6): implement a route that returns all albums ordered by release date (descending)
  // Note that in this case you will need to return multiple albums, so you will need to return an array of objects
  connection.query(`SELECT * 
  FROM Albums 
  ORDER BY release_date DESC`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      const items = [];
      let i = 0;
      while (i < data.length) {
        items.push(data[i]);
        i++;
      }
      res.json(items);
    }
  });
}

// Route 6: GET /album_songs/:album_id
const album_songs = async function(req, res) {
  // TODO (TASK 7): implement a route that given an album_id, returns all songs on that album ordered by track number (ascending)
  connection.query(`SELECT * 
  FROM Songs 
  WHERE album_id="${req.params.album_id}"
  ORDER BY number ASC`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      const items = [];
      let i = 0;
      while (i < data.length) {
        items.push({song_id: data[i].song_id, title: data[i].title, number: data[i].number, duration: data[i].duration,plays: data[i].plays});
        i++;
      }
      res.json(items);
    }
  });
}

/************************
 * ADVANCED INFO ROUTES *
 ************************/

// Route 7: GET /top_songs
const top_songs = async function(req, res) {
  const page = req.query.page;
  // TODO (TASK 8): use the ternary (or nullish) operator to set the pageSize based on the query or default to 10
  const pageSize = req.query.page_size ? req.query.page_size:10;
  if (!page) {
    // TODO (TASK 9)): query the database and return all songs ordered by number of plays (descending)
    // Hint: you will need to use a JOIN to get the album title as well
    connection.query(`SELECT Songs.song_id, Songs.album_id, Albums.title as album, Songs.title, Songs.plays
    FROM Songs JOIN Albums ON Songs.album_id=Albums.album_id
    ORDER BY plays DESC`, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push({song_id: data[i].song_id,album:data[i].album, album_id:data[i].album_id, title: data[i].title, plays: data[i].plays});
          i++;
        }
        res.json(items);
      }
    });

  } else {
    // TODO (TASK 10): reimplement TASK 9 with pagination
    // Hint: use LIMIT and OFFSET (see https://www.w3schools.com/php/php_mysql_select_limit.asp)
    connection.query(`SELECT Songs.song_id, Songs.album_id, Albums.title as album, Songs.title, Songs.plays
    FROM Songs JOIN Albums ON Songs.album_id=Albums.album_id
    ORDER BY plays DESC LIMIT ${pageSize} OFFSET ${(page-1) * pageSize}`, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push({song_id: data[i].song_id,album:data[i].album, album_id:data[i].album_id, title: data[i].title, plays: data[i].plays});
          i++;
        }
        res.json(items);
      }
    });
  }
}

// Route 8: GET /top_albums
const top_albums = async function(req, res) {
  // TODO (TASK 11): return the top albums ordered by aggregate number of plays of all songs on the album (descending), with optional pagination (as in route 7)
  // Hint: you will need to use a JOIN and aggregation to get the total plays of songs in an album
  const page = req.query.page;
  const pageSize = req.query.page_size ? req.query.page_size:10;
  if (!page) {
    connection.query(`WITH aggregation_tb AS
    (SELECT Albums.album_id, SUM(Songs.plays) AS plays
    FROM Songs JOIN Albums ON Songs.album_id=Albums.album_id GROUP BY Albums.album_id)
    SELECT * FROM Albums a1 JOIN aggregation_tb ON a1.album_id=aggregation_tb.album_id ORDER BY plays DESC`, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push({album_id: data[i].album_id, title:data[i].title, plays: data[i].plays});
          i++;
        }
        res.json(items);
      }
    });

  } else {
    connection.query(`WITH aggregation_tb AS
    (SELECT Albums.album_id, SUM(Songs.plays) AS plays
    FROM Songs JOIN Albums ON Songs.album_id=Albums.album_id GROUP BY Albums.album_id)
    SELECT * FROM Albums a1 JOIN aggregation_tb ON a1.album_id=aggregation_tb.album_id ORDER BY plays DESC LIMIT ${pageSize} OFFSET ${(page-1) * pageSize}`, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push({album_id: data[i].album_id,title:data[i].title, plays: data[i].plays});
          i++;
        }
        res.json(items);
      }
    });
  }
}

// Route 9: GET /search_albums
const search_songs = async function(req, res) {
  // TODO (TASK 12): return all songs that match the given search query with parameters defaulted to those specified in API spec ordered by title (ascending)
  // Some default parameters have been provided for you, but you will need to fill in the rest
  const title = req.query.title;
  const durationLow = req.query.duration_low ?? 60;
  const durationHigh = req.query.duration_high ?? 660;
  const plays_low = req.query.plays_low ?? 0;
  const plays_high = req.query.plays_high ?? 1100000000;
  const danceability_low = req.query.danceability_low ?? 0;
  const danceability_high = req.query.danceability_high ?? 1;
  const energy_low = req.query.energy_low ?? 0;
  const energy_high = req.query.energy_high ?? 1;
  const valence_low = req.query.valence_low ?? 0;
  const valence_high = req.query.valence_high ?? 1;
  const explicit = req.query.explicit === 'true' ? 1 : 0;
  if (!title) {
    connection.query(`SELECT * FROM Songs WHERE
    duration >= ${durationLow} AND duration <= ${durationHigh} AND
    danceability >= ${danceability_low} AND danceability <= ${danceability_high} AND
    plays >= ${plays_low} AND plays <= ${plays_high} AND
    energy >= ${energy_low} AND energy <= ${energy_high} AND
    valence >=${valence_low} AND valence <= ${valence_high} AND
    explicit <= ${explicit} ORDER BY title ASC`, (err, data) => {
      if (err) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push(data[i]);
          i++;
        }
        res.json(items);
      }
    });

  } else {
    const new_title=title.replaceAll('"','');
    connection.query(`SELECT * FROM Songs WHERE
    duration >= ${durationLow} AND duration <= ${durationHigh} AND
    danceability >= ${danceability_low} AND danceability <= ${danceability_high} AND
    plays >= ${plays_low} AND plays <= ${plays_high} AND
    energy >= ${energy_low} AND energy <= ${energy_high} AND
    valence >=${valence_low} AND valence <= ${valence_high} AND
    explicit <= ${explicit} AND
    title LIKE "%${new_title}%"
    ORDER BY title ASC`, (err, data) => {
      if (err) {
        console.log(err);
        res.json({});
      } else {
        const items = [];
        let i = 0;
        while (i < data.length) {
          items.push(data[i]);
          i++;
        }
        res.json(items);
      }
    });
  }
}

module.exports = {
  author,
  random,
  song,
  album,
  albums,
  album_songs,
  top_songs,
  top_albums,
  search_songs,
}
