require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  await c.query("DELETE FROM settlements WHERE id='d14f94e1-4b08-4d9a-9545-77f9477836f4'");
  console.log('Deleted');
  process.exit(0);
}
run();
