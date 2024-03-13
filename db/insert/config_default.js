// Path: server/db/insert/config_default.js

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

// Configure the connection to your Heroku Postgres database
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Define your SQL query
const sqlQuery = `
    INSERT INTO config (name, value)
    VALUES ('rating_threshold', '2599');

    INSERT INTO config (name, value)
    VALUES ('min_games', '10');

    INSERT INTO config (name, value)
    VALUES ('time_control', 'blitz');

    INSERT INTO config (name, value)
    VALUES ('is_active', 'true');

    INSERT INTO config (name, value)
    VALUES ('created_before', '2023-06-29 16:00:00+00');

    INSERT INTO config (name, value)
    VALUES ('admin_account', 'cheth_testing');

    INSERT INTO config (name, value)
    VALUES ('follows_admin', 'true');
`;

// Execute the SQL query
pool.query(sqlQuery, (err, res) => {
    if (err) {
        console.error('Error executing query', err.stack);
    } else {
        console.log('Data is successfully inserted');
    }
    pool.end();
});
