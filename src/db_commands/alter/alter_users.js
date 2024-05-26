// Path: server/db_commands/alter/alter_games.js

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
    ALTER TABLE users
    ADD COLUMN bullet_rating INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN blitz_rating INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN rapid_rating INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN bullet_games INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN blitz_games INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN rapid_games INTEGER NOT NULL DEFAULT 0;
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
