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
    DROP TABLE games;
`;

// Connect to the database and execute the SQL query
pool.query(sqlQuery, (err, result) => {
    if (err) {
        console.error('Error executing SQL query:', err);
    } else {
        console.log('Table dropped successfully:', result);
    }
    
    // Close the database connection
    pool.end();
});
