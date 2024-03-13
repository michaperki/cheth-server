const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectToDatabase = async () => {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
};

const getConfig = async () => {
    try {
        const { rows } = await client.query('SELECT * FROM config');
        return rows;
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
};

module.exports = {
    connectToDatabase,
    getConfig
};
