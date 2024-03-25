// __tests__/routes.test.js

const request = require('supertest');
const app = require('../server'); // Assuming your express app is exported as 'app'

describe('Test the /api/checkEligibility route', () => {
    test('It should respond with 200 and an eligibility check result', async () => {
        const response = await request(app)
            .post('/api/checkEligibility')
            .send({ lichessHandle: 'testUser' });

        expect(response.statusCode).toBe(200);
        expect(response.body.isEligible).toBeDefined();
    });
});

// Add similar tests for other routes
