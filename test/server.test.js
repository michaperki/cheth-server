const request = require('supertest');
const http = require('http');
const { app } = require('../server'); // Adjust the path to your server file
const sinon = require('sinon');
const db = require('../db'); // The actual db module
const mockDb = require('./mocks/db'); // The mock db module

let expect;
let server;

describe('Server', function () {
    before(async function () {
        // Dynamically import chai
        const chai = await import('chai');
        expect = chai.expect;

        // Replace the actual db module with the mock
        sinon.replace(db, 'connectToDatabase', mockDb.connectToDatabase);

        // Start the server on a random available port
        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
    });

    after(function (done) {
        // Restore the original db module
        sinon.restore();

        // Close the server after tests
        if (server && server.listening) {
            server.close(done);
        } else {
            done();
        }
    });

    it('should connect to the database', function (done) {
        db.connectToDatabase(
            () => {
                expect(true).to.be.true;
                done();
            },
            (error) => {
                done(error);
            }
        );
    });
});

