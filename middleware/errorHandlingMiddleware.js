// errorHandlingMiddleware.js

const handleErrors = (fn) => async (...args) => {
    try {
        return await fn(...args);
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
};

module.exports = handleErrors;