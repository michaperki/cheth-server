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
    CREATE TABLE games (
	game_id SERIAL PRIMARY KEY,
	contract_address VARCHAR(255) NULL,
	transaction_hash VARCHAR(255) NULL,
	game_creator_address VARCHAR(255) NULL,
	player1_id INTEGER NOT NULL,
	player1_rating INTEGER DEFAULT NULL,
	player1_ready BOOLEAN DEFAULT FALSE,
	player2_id INTEGER DEFAULT NULL,
	player2_rating INTEGER DEFAULT NULL,
	player2_ready BOOLEAN DEFAULT FALSE,
	time_control INTEGER DEFAULT 0,
	state VARCHAR(255) NOT NULL,
	winner INTEGER DEFAULT NULL,
	wager INTEGER DEFAULT 0,
	reward_pool bigint DEFAULT 0,
	player1_payout bigint DEFAULT 0,
	player2_payout bigint DEFAULT 0,
	commission bigint DEFAULT 0,
	lichess_id VARCHAR(255) NULL,
	rematch_requested BOOLEAN DEFAULT FALSE,
	rematch_requested_by INTEGER DEFAULT NULL,
	rematch_accepted BOOLEAN DEFAULT FALSE,
	rematch_declined BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (rematch_requested_by) REFERENCES users(user_id),
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
