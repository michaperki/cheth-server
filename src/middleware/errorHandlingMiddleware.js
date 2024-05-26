const logger = require("../../dist/utils/LoggerUtils").logger;

const handleErrors =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

module.exports = handleErrors;
