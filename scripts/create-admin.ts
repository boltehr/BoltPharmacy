import { pool, db } from '../server/db';
import { hash } from 'bcrypt';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  console.log('Connecting to database...');
  try {
    // Check if admin already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
    
    if (existingAdmin) {
      console.log('Admin user already exists, updating role...');
      await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.email, 'admin@example.com'));
      console.log('Admin role updated successfully!');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await hash('Admin123!', 10);
      
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '555-987-6543',
        address: '456 Admin St',
        city: 'Admintown',
        state: 'CA',
        zipCode: '12345',
        dateOfBirth: '1985-05-05',
        sexAtBirth: 'female',
        profileCompleted: true,
        role: 'admin'
      });
      
      console.log('Admin user created successfully!');
    }
    
    // Verify admin
    const [admin] = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
    console.log('Admin user:', { email: admin.email, role: admin.role });
    
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

createAdminUser();