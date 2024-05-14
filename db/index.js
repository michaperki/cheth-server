const userService = require('./userService');
const gameService = require('./gameService');
const configService = require('./configService');
const { connectToDatabase } = require('./db');
const handleErrors = require('../middleware/errorHandlingMiddleware');

module.exports = {
    connectToDatabase: handleErrors(connectToDatabase),
    ...userService,
    ...gameService,
    ...configService
};

