require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const {Client} = require('pg');
const path = require('path');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');

// start the express app
const app  = express();
const port = 3000;

// setup the databse using the .env information
const db = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// connect to the database
db.connect()
  // give a success message
  .then(() => {
    console.log('Connected to Postgres');
    return initializeTables();
  })
  // or return an error message
  .catch(err => console.error('DB connection error:', err.stack));

// define the initialize tables function
async function initializeTables() {
  // start by dropping any existing tables
  await db.query(`DROP TABLE IF EXISTS participants CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS time_slots CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS calendars CASCADE;`);
  await db.query(`DROP TABLE IF EXISTS users CASCADE;`);

  // make the user's table
  await db.query(`
    CREATE TABLE users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // make the calendar's table
  await db.query(`
    CREATE TABLE calendars (
      id VARCHAR(255) PRIMARY KEY,
      owner_id VARCHAR(255) REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // make the time slots table
  await db.query(`
    CREATE TABLE time_slots (
      id VARCHAR(255) PRIMARY KEY,
      calendar_id VARCHAR(255) REFERENCES calendars(id) ON DELETE CASCADE,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      max_participants INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // make the participant's table
  await db.query(`
    CREATE TABLE participants (
      id VARCHAR(255) PRIMARY KEY,
      time_slot_id VARCHAR(255) REFERENCES time_slots(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // give a message for the success
  console.log('Tables initialized');
}

// setup the middleware
app.use(cors({credentials: true, origin: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false}));

// set the view engine for ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// setup the express session
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// http routes

// render the signup page
app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// handle the signup 
app.post('/signup', async (req, res) => {
  // get the username and the password
  const {username, password} = req.body;
  // create the unique identifier
  const id = uuidv4();
  // first try to insert the new user information into the users table
  try {
    await db.query(
      'INSERT INTO users(id, username, password) VALUES($1,$2,$3)',
      [id, username, password]
    );
    // and send the new user to the signin page
    res.redirect('/signin');
    // if something goes wrong it will be because a credential is repeated
  } catch (err) {
    // give back the error message
    res.render('signup', {error: 'Username already taken'});
  }
});

// render the signin page
app.get('/signin', (req, res) => {
  res.render('signin', { error: null });
});

// handle the signin
app.post('/signin', async (req, res) => {
  // get the username and password
  const { username, password } = req.body;
  try {
    // try to check if the entered information exist in the database
    // first query for them
    const result = await db.query(
      'SELECT id, username FROM users WHERE username=$1 AND password=$2',
      [username, password]
    );
    // if no result comes back then give an error
    if (result.rowCount === 0) {
      return res.render('signin', { error: 'No User Found' });
    }
    // otherwise take the returned user info
    req.session.user = result.rows[0];
    // and send the user to the dashboard page
    res.redirect('/dashboard');
  } catch (err) {
    // if the query made an error then it is a server error, and show it
    console.error(err);
    res.render('signin', {error: 'Server error'});
  }
});

// handle the logout
app.get('/logout', (req, res) => {
  // if logout is pressed end the express session and send them back to signin
  req.session.destroy(() => res.redirect('/signin'));
});

// render the index landing page
app.get('/', (req, res) => {
  res.render('index');
});

// handle the dashboard
app.get('/dashboard', async (req, res) => {
  // first check the user is authenticated in the session
  if (!req.session.user) {
    return res.redirect('/signin');
  }
  // then find all the user's calendars
  const owner_id = req.session.user.id;
  const cal_res  = await db.query(
    'SELECT * FROM calendars WHERE owner_id = $1 ORDER BY created_at DESC',
    [owner_id]
  );
  // render the page and send the calendar information
  res.render('dashboard', {calendars: cal_res.rows});
});

// handle the client view
app.get('/view/:calendarId', async (req, res) => {
  // take the given calendar id and find it in the database
  const {calendarId} = req.params;
  const cal_res   = await db.query(
    'SELECT * FROM calendars WHERE id = $1',
    [calendarId]
  );
  // if the calendar is not found then return an error
  if (cal_res.rowCount === 0) {
    return res.status(404).send('Calendar not found');
  }
  // query for the time slots and find how many participants are matched to each one
  const slots_res = await db.query(
    `SELECT ts.id, ts.calendar_id, ts.start_time, ts.end_time, ts.max_participants,
     COUNT(p.id) AS current_participants
     FROM time_slots AS ts
     LEFT JOIN participants AS p
     ON p.time_slot_id = ts.id
     WHERE ts.calendar_id = $1
     GROUP BY ts.id, ts.calendar_id, ts.start_time, ts.end_time, ts.max_participants
     ORDER BY ts.start_time;`,
    [calendarId]
  );
  // render the page and send how many participants are found
  res.render('client_view', {
    calendar: cal_res.rows[0],
    slots: slots_res.rows
  });
});

// handle the client booking
app.post('/view/:calendarId/join/:slotId', async (req, res) => {
  const {calendarId, slotId} = req.params;
  const {name, email} = req.body;
  try {
    // check the capacity for the event
    const slot_quantity = await db.query(
      'SELECT max_participants FROM time_slots WHERE id=$1',
      [slotId]
    );
    // send an error if the time slot is not found
    if (slot_quantity.rowCount === 0) {
      return res.status(404).send('Slot not found');
    }
    // count how many signups exist for a slot
    const cntQ = await db.query(
      'SELECT COUNT(*)::int AS cnt FROM participants WHERE time_slot_id=$1',
      [slotId]
    );
    // check if the time slot if full
    if (cntQ.rows[0].cnt >= slot_quantity.rows[0].max_participants) {
      return res.status(400).send('Slot is full');
    }

    // insert the new participant
    await db.query(
      'INSERT INTO participants(id, time_slot_id, name, email) VALUES($1,$2,$3,$4)',
      [uuidv4(), slotId, name, email]
    );

    // refresh the page
    res.redirect(`/view/${calendarId}`);
  } catch (err) {
    // otherwise catch a server error
    console.error(err);
    res.status(500).send('Server error');
  }
});

// listen for the call for the calendar at id
app.get('/api/calendars/:id', async (req, res) => {
  try {
    // get the id
    const {id} = req.params;
    // query for the calendar
    const cal_res = await db.query('SELECT * FROM calendars WHERE id=$1', [id]);
    if (cal_res.rowCount === 0) {
      return res.status(404).json({error: 'Calendar not found'});
    }
    // query for the time slots ordered chronologically
    const slot_res = await db.query(
      `SELECT ts.*,
       COUNT(p.id) OVER (PARTITION BY ts.id) AS current_participants
       FROM time_slots AS ts
       LEFT JOIN participants AS p
       ON p.time_slot_id = ts.id
       WHERE ts.calendar_id = $1
       ORDER BY ts.start_time;`,
      [id]
    );
    // save the information in json
    res.json({calendar: cal_res.rows[0], timeSlots: slot_res.rows});
  } catch (err) {
    // send an error message if the process went wrong
    res.status(500).json({error: err.message});
  }
});

// handle the create calendar
app.post('/api/calendars', async (req, res) => {
  // get the needed information
  const {title, description} = req.body;
  // create a unique id
  const id = uuidv4();
  try {
    // try to insert into the table the new calendar information
    const result = await db.query(
      'INSERT INTO calendars(id, owner_id, title, description) VALUES($1,$2,$3,$4) RETURNING *',
      [id, (req.session.user && req.session.user.id) || null, title, description]
    );
    // send the new calendar as json
    res.json(result.rows[0]);
  } catch (err) {
    // otherwise an error occured
    res.status(500).json({error: err.message});
  }
});

// handle adding a new time slot
app.post('/api/calendars/:calendarId/time-slots', async (req, res) => {
  // get all the neccessary information
  const {calendarId} = req.params;
  const {startTime, endTime, maxParticipants} = req.body;
  const id = uuidv4();
  const max_participants = parseInt(maxParticipants) || 1;
  try {
    // query to insert the new time slot with its information
    const result = await db.query(
      `INSERT INTO time_slots
         (id, calendar_id, start_time, end_time, max_participants)
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [id, calendarId, startTime, endTime, max_participants]
    );
    // save to json
    res.json(result.rows[0]);
  } catch (err) {
    // otherwise send an error
    res.status(500).json({error: err.message});
  }
});

// handle a client booking
app.post('/api/time-slots/:id/participants', async (req, res) => {
  // start with getting the neccessary information
  const {id} = req.params;
  const {name, email} = req.body;
  const pid = uuidv4();
  try {
    // query for the time slot
    const slot = await db.query(
      'SELECT max_participants FROM time_slots WHERE id=$1',
      [id]
    );
    // if no time is found for the id then give back an error
    if (slot.rowCount === 0) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    // query for the number of people aready signed up
    const count = await db.query(
      'SELECT COUNT(*)::int AS cnt FROM participants WHERE time_slot_id=$1',
      [id]
    );
    // give back an error that the time slot is full
    if (count.rows[0].cnt >= slot.rows[0].max_participants) {
      return res.status(400).json({ error: 'Time slot is full' });
    }
    // insert the new participant in for the slot
    const result = await db.query(
      'INSERT INTO participants(id, time_slot_id, name, email) VALUES($1,$2,$3,$4) RETURNING *',
      [pid, id, name, email]
    );
    // save to json
    res.json(result.rows[0]);
  } catch (err) {
    // otherwise save an error
    res.status(500).json({ error: err.message });
  }
});

// export the express app and the database objects for the server
module.exports = {app, initializeTables, db};