import { pool, db } from './db';
import { sql } from 'drizzle-orm';

async function updateSchema() {
  try {
    console.log('Starting schema update...');
    
    // Add new columns to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS billing_address TEXT,
      ADD COLUMN IF NOT EXISTS billing_city TEXT,
      ADD COLUMN IF NOT EXISTS billing_state TEXT,
      ADD COLUMN IF NOT EXISTS billing_zip_code TEXT,
      ADD COLUMN IF NOT EXISTS same_as_shipping BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE
    `);
    
    console.log('Schema updated successfully!');
    
    // Close the pool
    await pool.end();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating schema:', error);
    await pool.end();
    return { success: false, error };
  }
}

// Run the migration
updateSchema().then((result) => {
  if (result.success) {
    console.log('Database schema update completed successfully!');
    process.exit(0);
  } else {
    console.error('Database schema update failed:', result.error);
    process.exit(1);
  }
});