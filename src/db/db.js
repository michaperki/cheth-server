const { Client } = require("pg");
const { logger } = require("../../dist/utils/LoggerUtils");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectToDatabase = () => {
  return client.connect()
    .then(() => logger.info("Connected to the database"))
    .catch((error) => {
      logger.error("Error connecting to the database:", error);
      throw error;  // re-throw the error to be caught in server.js
    });
};

module.exports = {
  client,
  connectToDatabase,
};
