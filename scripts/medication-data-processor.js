/**
 * Medication Data Processor
 * 
 * This script helps process and format medication data for import into our database.
 * It provides a structure for manually collected medication information.
 * 
 * IMPORTANT: This script does NOT automatically scrape any website.
 * You must manually collect the data in accordance with the website's terms of service.
 */

import fs from 'fs';
import path from 'path';

// Define categories that align with common pharmacy classifications
const CATEGORIES = {
  HEART: "Heart Health",
  DIABETES: "Diabetes",
  MENTAL: "Mental Health",
  PAIN: "Pain Relief",
  ALLERGIES: "Allergies",
  ANTIBIOTICS: "Antibiotics",
  BLOOD_PRESSURE: "Blood Pressure",
  CHOLESTEROL: "Cholesterol",
  GASTRO: "Gastrointestinal",
  SKIN: "Skin Conditions",
  THYROID: "Thyroid",
  RESPIRATORY: "Respiratory",
  HORMONE: "Hormone Therapy",
  NEUROLOGICAL: "Neurological",
  OPHTHALMOLOGY: "Ophthalmology",
  UROLOGY: "Urology",
  OTHER: "Other"
};

// Format for medication data
const medicationTemplate = {
  name: "",
  genericName: "",
  brandName: "",
  manufacturer: "",
  description: "",
  dosage: "",
  category: "",
  price: 0,
  discountPrice: 0,
  inStock: true,
  requiresPrescription: true,
  sideEffects: "",
  warnings: "",
  imageUrl: "/images/medications/default.jpg"
};

/**
 * Creates a properly formatted medication entry
 * @param {Object} data - Medication data to format
 * @returns {Object} Formatted medication object
 */
function createMedication(data) {
  const medication = {...medicationTemplate};
  
  for (const key in data) {
    if (data[key] !== undefined) {
      medication[key] = data[key];
    }
  }
  
  // If discount price is not provided, set it to 80% of the regular price
  if (!data.discountPrice && data.price) {
    medication.discountPrice = Math.round((data.price * 0.8) * 100) / 100;
  }
  
  return medication;
}

/**
 * Saves an array of medications to a JSON file
 * @param {Array} medications - Array of medication objects
 * @param {string} filename - Output filename
 */
function saveMedicationsToJson(medications, filename = 'medications-for-import.json') {
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, JSON.stringify(medications, null, 2));
  console.log(`Saved ${medications.length} medications to ${outputPath}`);
}

/**
 * Example of how to use this script with manually gathered data
 */
function createSampleData() {
  // This is where you would manually add medication data you've gathered
  const medications = [
    // Blood Pressure medications
    createMedication({
      name: "Lisinopril",
      genericName: "Lisinopril",
      brandName: "Prinivil, Zestril",
      manufacturer: "Various Manufacturers",
      description: "Lisinopril is an ACE inhibitor used to treat high blood pressure and heart failure. It can also improve survival after a heart attack and prevent kidney problems in people with diabetes.",
      dosage: "Available in 2.5mg, 5mg, 10mg, 20mg, 30mg, 40mg tablets",
      category: CATEGORIES.BLOOD_PRESSURE,
      price: 12.99,
      discountPrice: 4.99,
      requiresPrescription: true,
      sideEffects: "Dizziness, headache, dry cough, fatigue, elevated potassium levels",
      warnings: "May cause harm to an unborn baby. Do not use if pregnant or planning to become pregnant. May cause angioedema (swelling of face, lips, tongue, throat)."
    }),
    
    // Cholesterol medications
    createMedication({
      name: "Atorvastatin",
      genericName: "Atorvastatin",
      brandName: "Lipitor",
      manufacturer: "Various Manufacturers",
      description: "Atorvastatin belongs to a group of drugs called HMG CoA reductase inhibitors, or 'statins'. It reduces levels of bad cholesterol (LDL) and triglycerides in the blood, while increasing levels of good cholesterol (HDL).",
      dosage: "Available in 10mg, 20mg, 40mg, 80mg tablets",
      category: CATEGORIES.CHOLESTEROL,
      price: 18.99,
      discountPrice: 7.50,
      requiresPrescription: true,
      sideEffects: "Muscle pain, joint pain, digestive problems, mild memory problems or confusion",
      warnings: "Contact your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness, especially if accompanied by fever or tiredness."
    }),
    
    // Add more manually gathered medications here...
  ];
  
  return medications;
}

// Generate and save sample data
const sampleMedications = createSampleData();
saveMedicationsToJson(sampleMedications);

// Instructions for use
console.log("\n==== MEDICATION DATA IMPORT HELPER ====");
console.log("\nTo collect and import medication data legally:");
console.log("1. Manually gather medication information from legitimate sources");
console.log("2. Add the data to this script using the createMedication function");
console.log("3. Run the script to generate a properly formatted JSON file");
console.log("4. Log in as an admin and add medications through the admin interface");
console.log("\nIMPORTANT: Always respect website terms of service and copyright laws.");
console.log("Do not use automated scraping tools without proper permission.\n");

// Export functions and constants for use in other scripts
export { CATEGORIES, medicationTemplate, createMedication, saveMedicationsToJson };