const request = require('supertest');
const app = require('../server');

describe('POST /api/calendars', () => {
  it('should create a calendar with the correct information', async () => {
    const calendarData = {
      title: 'Test Calendar',
      description: 'A calendar for testing'
    };

    const response = await request(app)
      .post('/api/calendars')
      .send(calendarData)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(calendarData.title);
    expect(response.body.description).toBe(calendarData.description);
  });
}); 