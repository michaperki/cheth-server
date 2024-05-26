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
    -- Update blitz_rating if it's at its default value
    UPDATE users
    SET blitz_rating = rating
    WHERE blitz_rating = 1000;

    -- Update bullet_rating if it's at its default value
    UPDATE users
    SET bullet_rating = rating
    WHERE bullet_rating = 1000;

    -- Update rapid_rating if it's at its default value
    UPDATE users
    SET rapid_rating = rating
    WHERE rapid_rating = 1000;

    -- Drop the rating column
    ALTER TABLE users
    DROP COLUMN rating;
`;

// Execute the SQL query
pool.query(sqlQuery, (err, res) => {
    if (err) {
        console.error('Error executing query', err.stack);
    } else {
        console.log('Data is successfully updated');
    }
    pool.end();
});


