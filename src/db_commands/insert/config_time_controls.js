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
    VALUES ('time_controls', '[{"control": "60", "name": "Bullet"}, {"control": "180", "name": "Blitz"}, {"control": "300", "name": "Rapid"}]');
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
