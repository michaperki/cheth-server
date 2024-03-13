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
    CREATE TABLE games (
        game_id SERIAL PRIMARY KEY,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER DEFAULT NULL,
        state VARCHAR(255) NOT NULL,
        fen VARCHAR(255) DEFAULT NULL,
        last_move VARCHAR(255) DEFAULT NULL,
        winner INTEGER DEFAULT NULL,
        FOREIGN KEY (player1_id) REFERENCES users(user_id),
        FOREIGN KEY (player2_id) REFERENCES users(user_id),
        FOREIGN KEY (winner) REFERENCES users(user_id)
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
