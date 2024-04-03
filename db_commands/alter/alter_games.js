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
    ALTER TABLE games
    ADD COLUMN player1_ready BOOLEAN DEFAULT FALSE,
    ADD COLUMN player2_ready BOOLEAN DEFAULT FALSE
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
