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
        contract_address VARCHAR(255) NULL,
        transaction_hash VARCHAR(255) NULL,
        game_creator_address VARCHAR(255) NULL,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER DEFAULT NULL,
        time_control INTEGER DEFAULT 0,
        state VARCHAR(255) NOT NULL,
        winner INTEGER DEFAULT NULL,
        wager INTEGER DEFAULT 0,
        reward_pool bigint DEFAULT 0,
        lichess_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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
