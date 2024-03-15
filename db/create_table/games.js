const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

// Configure the connection to your Heroku Postgres database
const pool = new Pool({
    connectionString: 'postgres://xftwwclpyvzzqm:ea793afacee56a9d17a19610aa366b8e00494799164ad502f287493fadd571fb@ec2-3-221-175-22.compute-1.amazonaws.com:5432/d661ne4qhp5q0p',
    ssl: {
        rejectUnauthorized: false
    }
});

// Define your SQL query
const sqlQuery = `
    CREATE TABLE games (
        game_id SERIAL PRIMARY KEY,
        contract_game_id VARCHAR(255) NULL,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER DEFAULT NULL,
        state VARCHAR(255) NOT NULL,
        fen VARCHAR(255) DEFAULT NULL,
        last_move VARCHAR(255) DEFAULT NULL,
        winner INTEGER DEFAULT NULL,
        reward_pool bigint DEFAULT 0,
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
