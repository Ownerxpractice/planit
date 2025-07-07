// tests/app.test.js
const request = require('supertest')
const { app, initializeTables, db } = require('../app')

describe('PlanIt API', () => {
  let calendarId

  beforeAll(async () => {
    // build a fresh schema
    await initializeTables()
  })

  afterAll(async () => {
    // close the DB connection so Jest can exit
    await db.end()
  })

  it('POST /api/calendars → creates a calendar', async () => {
    const res = await request(app)
      .post('/api/calendars')
      .send({ title: 'Test Calendar', description: 'for testing' })
      .expect(200)

    expect(res.body).toHaveProperty('id')
    expect(res.body.title).toBe('Test Calendar')

    calendarId = res.body.id
  })

  it('GET /api/calendars/:id → fetches that calendar', async () => {
    const res = await request(app)
      .get(`/api/calendars/${calendarId}`)
      .expect(200)

    expect(res.body.calendar.id).toBe(calendarId)
    expect(Array.isArray(res.body.timeSlots)).toBe(true)
  })
})