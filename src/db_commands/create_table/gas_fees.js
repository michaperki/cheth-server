const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = 'postgres://xftwwclpyvzzqm:ea793afacee56a9d17a19610aa366b8e00494799164ad502f287493fadd571fb@ec2-3-221-175-22.compute-1.amazonaws.com:5432/d661ne4qhp5q0p'; 
// process.env.DATABASE_URL;
// Configure the connection to your Heroku Postgres database
const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
});

// Define your SQL query
const sqlQuery = `
CREATE TABLE IF NOT EXISTS gas_fees (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(game_id),
  operation_type VARCHAR(50) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  gas_used NUMERIC NOT NULL,
  gas_price NUMERIC NOT NULL,
  gas_fee_wei NUMERIC NOT NULL,
  gas_fee_eth NUMERIC(20, 18) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
