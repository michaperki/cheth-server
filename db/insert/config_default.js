// Path: server/db/insert/config_default.js

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = "postgres://mrvvycpfnbmhlg:0a15ec34316816aef590db493385b5f88a8b6ab2421f3151ff359424862a85e6@ec2-107-21-67-46.compute-1.amazonaws.com:5432/d35mdin9n3b2mo";

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
    VALUES ('rating_threshold', '2599');

    INSERT INTO config (name, value)
    VALUES ('min_games', '10');

    INSERT INTO config (name, value)
    VALUES ('time_control', 'blitz');

    INSERT INTO config (name, value)
    VALUES ('is_active', 'true');

    INSERT INTO config (name, value)
    VALUES ('created_before', '2023-06-29 16:00:00+00');

    INSERT INTO config (name, value)
    VALUES ('admin_account', 'cheth_testing');

    INSERT INTO config (name, value)
    VALUES ('follows_admin', 'true');
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
