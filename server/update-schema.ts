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
    
    // Create refill_requests table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refill_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        prescription_id INTEGER REFERENCES prescriptions(id),
        medication_id INTEGER NOT NULL REFERENCES medications(id),
        request_date TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'pending' NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        notes TEXT,
        last_filled_date TIMESTAMP,
        next_refill_date DATE,
        times_refilled INTEGER DEFAULT 0,
        refills_remaining INTEGER,
        refills_authorized INTEGER,
        auto_refill BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Create refill_notifications table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refill_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        refill_request_id INTEGER REFERENCES refill_requests(id),
        message TEXT NOT NULL,
        sent_date TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT FALSE,
        notification_type TEXT NOT NULL
      )
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