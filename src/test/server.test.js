const request = require('supertest');
const app = require('../server'); // Adjust the path to your server file

let expect;

describe('Server', function () {
    before(async function () {
        // Dynamically import chai
        const chai = await import('chai');
        expect = chai.expect;
    });

    it('should return a list of icons on GET /allIcons', function (done) {
        request(app)
            .get('/allIcons')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body).to.be.an('object');
                expect(res.body.icons).to.be.an('array');
                done();
            });
    });
});

