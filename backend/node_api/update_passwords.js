require('dotenv').config();
const db = require('./src/config/database');
const HASH = '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6';
db.query('UPDATE users SET password_hash = $1', [HASH])
  .then(res => { 
    console.log('Updated', res.rowCount, 'users'); 
    process.exit(0); 
  })
  .catch(console.error);
