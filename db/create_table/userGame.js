const { Pool } = require('pg');
require('dotenv').config();

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
    CREATE TABLE userGame (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        game_id INTEGER REFERENCES games(game_id),
        score INTEGER NOT NULL
    );
`;

// Connect to the database and execute the SQL query
pool.query(sqlQuery, (err, result) => {
    if (err) {
        console.error('Error executing SQL query:', err);
    } else {
        console.log('Table created successfully:', result);
    }
    
    // Close the database connection
    pool.end();
});
