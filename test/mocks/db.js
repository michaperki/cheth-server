const sinon = require('sinon');

const db = {
    connectToDatabase: sinon.stub()
};

db.connectToDatabase.callsFake((successCallback, errorCallback) => {
    // Simulate a successful connection
    setTimeout(() => {
        successCallback();
    }, 100);
});

module.exports = db;

