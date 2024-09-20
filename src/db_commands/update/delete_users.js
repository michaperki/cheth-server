require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = 'postgres://xftwwclpyvzzqm:ea793afacee56a9d17a19610aa366b8e00494799164ad502f287493fadd571fb@ec2-3-221-175-22.compute-1.amazonaws.com:5432/d661ne4qhp5q0p'; 

// Configure the connection to your Heroku Postgres database
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Define your SQL query
const sqlQuery = `
DELETE FROM users
WHERE user_id NOT IN (
    SELECT player1_id FROM games
    UNION
    SELECT player2_id FROM games
    WHERE player2_id IS NOT NULL
)
AND username NOT IN ('michaperki', 'cheth_testing');
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
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


