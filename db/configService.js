const { client } = require('./db');

const getConfig = async () => {
    const { rows } = await client.query('SELECT * FROM config');
    return rows;
};

module.exports = {
    getConfig
};

