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

const addUser = async (username, rating, walletAddress, darkMode) => {
    try {
        const { rows } = await client.query('INSERT INTO users (username, rating, wallet_address, dark_mode) VALUES ($1, $2, $3, $4) RETURNING *', [username, rating, walletAddress, darkMode]);
        return rows;
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const getUserByLichessHandle = async (lichessHandle) => {
    try {
        const { rows } = await client.query('SELECT * FROM users WHERE username = $1', [lichessHandle]);
        return rows.length > 0 ? rows[0] : null; // Return the first row if found, otherwise return null
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const getUserByWalletAddress = async (walletAddress) => {
    console.log('walletAddress', walletAddress)
    try {
        const { rows } = await client.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
        return rows.length > 0 ? rows[0] : null; // Return the first row if found, otherwise return null
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const createGame = async (whiteUserId) => {
    try {
        const { rows } = await client.query('INSERT INTO games (player1_id, state) VALUES ($1, 0) RETURNING *', [whiteUserId]);
        return rows;
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}


module.exports = {
    connectToDatabase,
    getConfig,
    addUser,
    getUserByLichessHandle,
    getUserByWalletAddress,
    createGame
};
