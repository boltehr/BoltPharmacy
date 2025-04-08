/**
 * Medication Import Helper
 * 
 * This script helps format medication data for import into our database.
 * IMPORTANT: This script does NOT automatically scrape any website.
 * 
 * Usage:
 * 1. Manually gather medication information from legitimate sources
 * 2. Format the data using this script
 * 3. Import the data through the admin interface
 */

import fs from 'fs';

// Sample medication template
const medicationTemplate = {
  name: "Medication Name",
  genericName: "Generic Name",
  brandName: "Brand Name",
  manufacturer: "Manufacturer",
  description: "Description of the medication and its uses",
  dosage: "Standard dosage information",
  category: "Medication Category",
  price: 9.99,
  discountPrice: 7.99,
  inStock: true,
  requiresPrescription: true,
  sideEffects: "Common side effects include...",
  warnings: "Do not use if...",
  imageUrl: "/images/medications/default.jpg"
};

// Common categories from pharmacy apps
const commonCategories = [
  "Heart Health",
  "Diabetes",
  "Mental Health",
  "Pain Relief",
  "Allergies",
  "Antibiotics",
  "Blood Pressure",
  "Cholesterol",
  "Gastrointestinal",
  "Skin Conditions",
  "Thyroid"
];

// Helper function to create a new medication entry
function createMedicationEntry(data) {
  const medication = {...medicationTemplate};
  
  // Override template values with provided data
  for (const key in data) {
    if (data[key] !== undefined) {
      medication[key] = data[key];
    }
  }
  
  return medication;
}

// Example usage
const sampleMedications = [
  createMedicationEntry({
    name: "Lisinopril",
    genericName: "Lisinopril",
    brandName: "Prinivil, Zestril",
    manufacturer: "Various Manufacturers",
    description: "Used to treat high blood pressure and heart failure.",
    dosage: "10mg, 20mg, 40mg tablets",
    category: "Blood Pressure",
    price: 12.99,
    discountPrice: 8.99,
    requiresPrescription: true,
    sideEffects: "Dizziness, headache, dry cough, fatigue",
    warnings: "Should not be used during pregnancy"
  }),
  createMedicationEntry({
    name: "Atorvastatin",
    genericName: "Atorvastatin",
    brandName: "Lipitor",
    manufacturer: "Various Manufacturers",
    description: "Used to lower cholesterol and to prevent cardiovascular disease.",
    dosage: "10mg, 20mg, 40mg, 80mg tablets",
    category: "Cholesterol",
    price: 18.99,
    discountPrice: 12.99,
    requiresPrescription: true,
    sideEffects: "Muscle pain, digestive problems, mild memory loss",
    warnings: "Tell your doctor if you experience unexplained muscle pain"
  })
];

// Output sample medications to a JSON file
fs.writeFileSync('sample-medications.json', JSON.stringify(sampleMedications, null, 2));

console.log("Sample medication data has been created in sample-medications.json");
console.log("\nTo add medications to your database:");
console.log("1. Use this script as a template to format your medication data");
console.log("2. Log in as an admin and go to the Medication Management page");
console.log("3. Add each medication through the admin interface");
console.log("\nRemember: Always respect website terms of service and copyright laws when gathering medication information.");

// Export functions and constants for use in other scripts
export { medicationTemplate, commonCategories, createMedicationEntry };