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
CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_request_logs_session_id ON request_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp);
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
