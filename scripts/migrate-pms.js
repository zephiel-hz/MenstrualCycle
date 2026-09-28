const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('No DATABASE_URL found in .env.local');
    process.exit(1);
  }
  const sql = neon(dbUrl);
  console.log('Applying ALTER TABLE migration...');
  const res = await sql("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reminder_pms boolean DEFAULT true NOT NULL;");
  console.log('Migration successfully applied:', res);
  
  // Verify columns
  const columns = await sql("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'user_settings';");
  console.log('user_settings columns:', columns);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
