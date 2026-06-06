import db from './server/db.js';

const [rows] = await db.execute('SELECT id, name, lat, lon FROM restaurants WHERE id="d32db48e-1009-4afa-afb7-4d2a340d105a"');
console.log(rows);
process.exit(0);
