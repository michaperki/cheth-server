const userService = require('./userService');
const gameService = require('./gameService');
const configService = require('./configService');
const { connectToDatabase } = require('./db');
const handleErrors = require('../middleware/errorHandlingMiddleware');
const { logRequest, getRequestStats } = require('./utilService');
module.exports = {
    connectToDatabase: handleErrors(connectToDatabase),
    logRequest,
    getRequestStats,
    ...userService,
    ...gameService,
    ...configService
};

