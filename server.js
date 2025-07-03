const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});


// Initialize database tables
async function initDatabase() {
  try {
    // Drop existing tables if they exist (for clean slate)
    await pool.query('DROP TABLE IF EXISTS participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS time_slots CASCADE');
    await pool.query('DROP TABLE IF EXISTS calendars CASCADE');

    // Create tables in correct order
    await pool.query(`
      CREATE TABLE calendars (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE time_slots (
        id VARCHAR(255) PRIMARY KEY,
        calendar_id VARCHAR(255) REFERENCES calendars(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        max_participants INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE participants (
        id VARCHAR(255) PRIMARY KEY,
        time_slot_id VARCHAR(255) REFERENCES time_slots(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes
app.get('/api/calendars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get calendar details
    const calendarResult = await pool.query(
      'SELECT * FROM calendars WHERE id = $1',
      [id]
    );

    if (calendarResult.rows.length === 0) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    // Get time slots with participant count
    const timeSlotsResult = await pool.query(`
      SELECT ts.*, 
             COALESCE(COUNT(p.id), 0) as current_participants
      FROM time_slots ts
      LEFT JOIN participants p ON ts.id = p.time_slot_id
      WHERE ts.calendar_id = $1
      GROUP BY ts.id, ts.calendar_id, ts.start_time, ts.end_time, ts.max_participants, ts.created_at
      ORDER BY ts.start_time
    `, [id]);

    res.json({
      calendar: calendarResult.rows[0],
      timeSlots: timeSlotsResult.rows
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/calendars', async (req, res) => {
  try {
    const { title, description } = req.body;
    const id = uuidv4();

    console.log('Creating calendar with:', { id, title, description });

    const result = await pool.query(
      'INSERT INTO calendars (id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [id, title, description]
    );

    console.log('Calendar created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/calendars/:calendarId/time-slots', async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { startTime, endTime, maxParticipants } = req.body;
    const id = uuidv4();

    // Ensure maxParticipants is a valid integer
    const maxParticipantsInt = parseInt(maxParticipants) || 1;

    console.log('Creating time slot with:', { id, calendarId, startTime, endTime, maxParticipantsInt });

    const result = await pool.query(
      'INSERT INTO time_slots (id, calendar_id, start_time, end_time, max_participants) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, calendarId, startTime, endTime, maxParticipantsInt]
    );

    console.log('Time slot created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/time-slots/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const participantId = uuidv4();

    // Check if slot is full
    const slotResult = await pool.query(
      'SELECT max_participants FROM time_slots WHERE id = $1',
      [id]
    );

    if (slotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    const participantCount = await pool.query(
      'SELECT COUNT(*) FROM participants WHERE time_slot_id = $1',
      [id]
    );

    if (parseInt(participantCount.rows[0].count) >= slotResult.rows[0].max_participants) {
      return res.status(400).json({ error: 'Time slot is full' });
    }

    const result = await pool.query(
      'INSERT INTO participants (id, time_slot_id, name, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [participantId, id, name, email]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
}); 
