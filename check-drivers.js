import db from './server/db.js';
async function test() {
  const [users] = await db.execute("SELECT id, name, role FROM users WHERE role='driver'");
  console.log('Users:', users);
  
  process.exit(0);
}
test();
