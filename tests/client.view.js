// client.view.js 
const request = require('supertest');
const { app, initializeTables, db } = require('../app')

describe('Basic route tests', () => {
    it('loads the homepage', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('<title>PlanIt calendar app</title>');
    });

    it('responds to bad route with a 404', async () => {
        const res = await request(app)
            .get('/error-message')
            .expect(404);
    });
});