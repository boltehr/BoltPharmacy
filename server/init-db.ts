import { storage } from './storage';
import { InsertCategory, InsertMedication } from '@shared/schema';

/**
 * Initialize the database with sample data 
 */
export async function initializeDatabase() {
  console.log('Initializing database with sample data...');
  
  // First, check if we already have categories
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) {
    console.log('Database already initialized with categories');
    return;
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
  
  console.log('Adding categories...');
  for (const category of categories) {
    await storage.createCategory(category);
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
  
  console.log('Adding medications...');
  for (const medication of medications) {
    await storage.createMedication(medication);
  }
  
  console.log('Database initialization complete!');
}