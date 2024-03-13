const { Pool } = require('pg');
require('dotenv').config();

// Configure the connection to your Heroku Postgres database
const pool = new Pool({
    connectionString: "postgres://ehtfbficwwwsrj:4693d4154db943e425737280a9c25e7f1706734520a1057fe66a0b3b51c7c80f@ec2-44-195-248-14.compute-1.amazonaws.com:5432/d4647u1u8g64ch",
    ssl: {
        rejectUnauthorized: false
    }
});

// Define your SQL query
const sqlQuery = `
    CREATE TABLE games (
        game_id SERIAL PRIMARY KEY,
        state VARCHAR(255) NOT NULL,
        turn INTEGER NOT NULL,
        fen VARCHAR(255) NOT NULL,
        last_move VARCHAR(255) NOT NULL
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
