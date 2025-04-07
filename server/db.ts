import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set!");
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("Connecting to PostgreSQL database...");

// Create a PostgreSQL connection pool with error handling
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some PG providers
  },
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000 // How long to wait for a connection
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connection successful, server time:', res.rows[0].now);
  }
});

// Create a Drizzle ORM instance
export const db = drizzle(pool);