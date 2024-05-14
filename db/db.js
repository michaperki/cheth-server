const { Client } = require('pg');
const { logger } = require('../utils/LoggerUtils');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectToDatabase = async () => {
    await client.connect();
    logger.info('Connected to the database');
};

module.exports = {
    client,
    connectToDatabase
};

