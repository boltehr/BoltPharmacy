import { storage } from './storage';
import { InsertCategory, InsertMedication, InsertUser } from '@shared/schema';
import { hashPassword, initializeAdminUser } from './auth';

/**
 * Initialize the database with sample data 
 */
export async function initializeDatabase() {
  console.log('Initializing database with sample data...');
  
  // Force reinitialization of users regardless of existing data
  console.log('Forcing reinitialization of users...');
  
  // Debug: List all existing users before initialization
  const existingUsers = await storage.getAllUsers();
  console.log('Existing users before initialization:', 
    existingUsers.map(u => ({id: u.id, email: u.email, role: u.role}))
  );
  
  // Add test user
  const testUser: InsertUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-123-4567',
    address: '123 Main St, Anytown, USA',
    dateOfBirth: '1990-01-01',
    sexAtBirth: 'male',
    role: 'user'
  };
  
  // Add admin user
  const adminUser: InsertUser = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!', // Will be hashed before storage
    firstName: 'Admin',
    lastName: 'User',
    phone: '555-987-6543',
    address: '456 Admin St, Admintown, USA',
    dateOfBirth: '1985-05-05',
    sexAtBirth: 'female',
    role: 'admin'
  };
  
  console.log('Admin user configuration:', JSON.stringify({
    email: adminUser.email,
    role: adminUser.role
  }));
  
  try {
    console.log('Adding test user...');
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(testUser.email);
    if (!existingUser) {
      // Hash the password before creating user
      const hashedPassword = await hashPassword(testUser.password);
      await storage.createUser({
        ...testUser,
        password: hashedPassword
      });
      console.log('Test user created successfully with hashed password');
    } else {
      console.log('Test user already exists, updating password...');
      // Reset password for existing test user
      const hashedPassword = await hashPassword(testUser.password);
      await storage.resetPassword(existingUser.id, hashedPassword);
      console.log('Test user password updated');
    }
    
    console.log('Adding admin user...');
    // Use our new admin initialization function
    try {
      const result = await initializeAdminUser();
      console.log('Admin user initialization result:', result);
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  } catch (error) {
    console.error('Failed to create test users:', error);
  }

  // Add categories
  const categories: InsertCategory[] = [
    { name: 'Heart Health', description: 'Medications for heart conditions', icon: 'favorite' },
    { name: 'Mental Health', description: 'Medications for mental health conditions', icon: 'psychology' },
    { name: 'Antibiotics', description: 'Medications to treat infections', icon: 'medical_services' },
    { name: 'Diabetes', description: 'Medications for diabetes management', icon: 'water_drop' },
    { name: 'Asthma', description: 'Medications for respiratory conditions', icon: 'air' },
    { name: 'Pain Relief', description: 'Medications for pain management', icon: 'healing' }
  ];
  
  try {
    console.log('Adding categories...');
    for (const category of categories) {
      const existingCategory = await storage.getCategoryByName(category.name);
      if (!existingCategory) {
        await storage.createCategory(category);
        console.log(`Category '${category.name}' created`);
      } else {
        console.log(`Category '${category.name}' already exists, skipping`);
      }
    }
  } catch (error) {
    console.error('Failed to create categories:', error);
  }
  
  // Add medications
  const medications: InsertMedication[] = [
    {
      name: 'Atorvastatin',
      genericName: 'Atorvastatin',
      brandName: 'Lipitor',
      description: 'Atorvastatin is used to treat high cholesterol and to lower the risk of stroke, heart attack, or other heart complications.',
      uses: 'Lowers cholesterol and triglycerides in the blood',
      sideEffects: 'Mild side effects include diarrhea, upset stomach, muscle and joint pain.',
      dosage: '10mg, 20mg, 40mg, 80mg tablets',
      price: 8.70,
      retailPrice: 43.50,
      requiresPrescription: true,
      inStock: true,
      category: 'Heart Health',
      popularity: 95
    },
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      brandName: 'Prinivil',
      description: 'Lisinopril is used to treat high blood pressure and heart failure.',
      uses: 'Treats high blood pressure and heart failure',
      sideEffects: 'Dry cough, dizziness, headache, and tiredness may occur.',
      dosage: '5mg, 10mg, 20mg, 40mg tablets',
      price: 4.80,
      retailPrice: 24.00,
      requiresPrescription: true,
      inStock: true,
      category: 'Heart Health',
      popularity: 90
    },
    {
      name: 'Metformin',
      genericName: 'Metformin',
      brandName: 'Glucophage',
      description: 'Metformin is used to treat type 2 diabetes.',
      uses: 'Controls blood sugar levels in type 2 diabetes',
      sideEffects: 'Nausea, vomiting, stomach upset, diarrhea, weakness, or a metallic taste may occur.',
      dosage: '500mg, 850mg, 1000mg tablets',
      price: 3.99,
      retailPrice: 19.95,
      requiresPrescription: true,
      inStock: true,
      category: 'Diabetes',
      popularity: 85
    },
    {
      name: 'Sertraline',
      genericName: 'Sertraline',
      brandName: 'Zoloft',
      description: 'Sertraline is used to treat depression, panic attacks, and anxiety.',
      uses: 'Treats depression, anxiety, and panic attacks',
      sideEffects: 'Nausea, diarrhea, tremor, insomnia, drowsiness, dizziness, dry mouth.',
      dosage: '25mg, 50mg, 100mg tablets',
      price: 6.50,
      retailPrice: 32.50,
      requiresPrescription: true,
      inStock: true,
      category: 'Mental Health',
      popularity: 80
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      description: 'Amoxicillin is a penicillin antibiotic that fights bacteria.',
      uses: 'Treats bacterial infections such as bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract',
      sideEffects: 'Diarrhea, nausea, vomiting, or rash may occur.',
      dosage: '250mg, 500mg capsules',
      price: 5.20,
      retailPrice: 26.00,
      requiresPrescription: true,
      inStock: true,
      category: 'Antibiotics',
      popularity: 75
    },
    {
      name: 'Albuterol',
      genericName: 'Albuterol',
      brandName: 'Ventolin',
      description: 'Albuterol is used to treat or prevent bronchospasm in people with asthma or certain other airway diseases.',
      uses: 'Prevents and treats wheezing, difficulty breathing, chest tightness, and coughing caused by lung diseases such as asthma',
      sideEffects: 'Nervousness, shaking, headache, throat irritation, nausea, or dizziness may occur.',
      dosage: '2mg, 4mg tablets; 90mcg inhaler',
      price: 12.99,
      retailPrice: 64.95,
      requiresPrescription: true,
      inStock: true,
      category: 'Asthma',
      popularity: 70
    }
  ];
  
  try {
    console.log('Adding medications...');
    for (const medication of medications) {
      // We don't have a way to check if medication already exists by name, so we'll try-catch each one
      try {
        await storage.createMedication(medication);
        console.log(`Medication '${medication.name}' created`);
      } catch (error) {
        console.error(`Failed to create medication '${medication.name}':`, error);
      }
    }
  } catch (error) {
    console.error('Failed to create medications:', error);
  }
  
  console.log('Database initialization complete!');
}