// import the .env information
require('dotenv').config();
// get the current express app
const {app} = require('./app');
// set the port number
const port = process.env.PORT || 3000;

// start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:3000`);
});