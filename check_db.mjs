import db from './server/db.js';

await db.execute(
  "UPDATE restaurants SET is_profile_complete = 0 WHERE registration_details IS NULL"
);
console.log('Reset missing profile details to 0');
process.exit(0);
