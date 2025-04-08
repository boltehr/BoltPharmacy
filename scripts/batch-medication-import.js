/**
 * Batch Medication Import Helper
 * 
 * This script provides a structured way to prepare medication data for import
 * based on manually collected information from legitimate sources.
 * 
 * NOTE: This script does NOT automatically scrape websites or violate any terms of service.
 * You must manually collect the data in accordance with the website's terms.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Medication categories (same as defined in your database)
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

// Base medication template
const medicationTemplate = {
  name: "",
  genericName: "",
  brandName: "",
  manufacturer: "Various Manufacturers",
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

// Create an array to store medications
let medications = [];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Get user input with a prompt
 * @param {string} prompt - The prompt to display
 * @returns {Promise<string>} - User's input
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Format price string to number
 * @param {string} priceStr - Price as string (e.g. "$12.99")
 * @returns {number} - Price as number
 */
function formatPrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned);
}

/**
 * Calculate discount price (80% of original)
 * @param {number} originalPrice - Original price
 * @returns {number} - Calculated discount price
 */
function calculateDiscountPrice(originalPrice) {
  return Math.round((originalPrice * 0.8) * 100) / 100;
}

/**
 * Show available categories and get user selection
 * @returns {Promise<string>} - Selected category
 */
async function selectCategory() {
  console.log("\nAvailable Categories:");
  Object.entries(CATEGORIES).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${value}`);
  });
  
  const selection = await question("\nSelect a category (number): ");
  const index = parseInt(selection) - 1;
  const categories = Object.values(CATEGORIES);
  
  if (index >= 0 && index < categories.length) {
    return categories[index];
  } else {
    console.log("Invalid selection. Using 'Other'.");
    return CATEGORIES.OTHER;
  }
}

/**
 * Get medication information from user input
 * @returns {Promise<Object>} - Medication data
 */
async function getMedicationInfo() {
  console.log("\n==== ENTER MEDICATION INFORMATION ====");
  
  const medication = {...medicationTemplate};
  
  medication.name = await question("Name: ");
  medication.genericName = await question("Generic Name (press Enter if same as Name): ") || medication.name;
  medication.brandName = await question("Brand Name(s): ");
  medication.description = await question("Description: ");
  medication.dosage = await question("Dosage (e.g. '10mg, 20mg tablets'): ");
  
  // Select category
  medication.category = await selectCategory();
  
  // Get prices
  const priceStr = await question("Price (e.g. $12.99): ");
  medication.price = formatPrice(priceStr);
  
  const discountPriceStr = await question("Discount Price (press Enter to auto-calculate): ");
  medication.discountPrice = discountPriceStr ? 
    formatPrice(discountPriceStr) : 
    calculateDiscountPrice(medication.price);
  
  // Get prescription requirement
  const requiresPrescriptionStr = await question("Requires Prescription? (y/n): ");
  medication.requiresPrescription = requiresPrescriptionStr.toLowerCase().startsWith("y");
  
  medication.sideEffects = await question("Side Effects: ");
  medication.warnings = await question("Warnings: ");
  
  return medication;
}

/**
 * Save medications array to JSON file
 * @param {Array} medications - Array of medication objects
 * @param {string} filename - Output JSON filename
 */
function saveMedicationsToJson(medications, filename = 'medications-for-import.json') {
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, JSON.stringify(medications, null, 2));
  console.log(`\nSaved ${medications.length} medications to ${outputPath}`);
}

/**
 * Load medications from existing JSON file if available
 * @param {string} filename - JSON file to load
 * @returns {Array} - Array of medication objects
 */
function loadExistingMedications(filename = 'medications-for-import.json') {
  try {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log("No existing file found or error reading file.");
  }
  return [];
}

/**
 * Main function to run the script
 */
async function main() {
  console.log("==== MEDICATION IMPORT HELPER ====");
  console.log("This tool helps you prepare medication data for import.");
  console.log("IMPORTANT: You must manually collect data in accordance with terms of service.");
  
  // Load existing medications if available
  medications = loadExistingMedications();
  console.log(`Loaded ${medications.length} existing medications.`);
  
  let addMore = true;
  
  while (addMore) {
    const medication = await getMedicationInfo();
    medications.push(medication);
    
    console.log(`\nAdded: ${medication.name} (${medication.category})`);
    
    const addMoreStr = await question("\nAdd another medication? (y/n): ");
    addMore = addMoreStr.toLowerCase().startsWith("y");
    
    // Save after each addition in case of interruption
    saveMedicationsToJson(medications);
  }
  
  console.log("\n==== IMPORT INSTRUCTIONS ====");
  console.log("1. Log in as an admin to the BoltEHR Pharmacy Platform");
  console.log("2. Navigate to Medication Management");
  console.log("3. Import each medication through the admin interface");
  console.log("\nThank you for using the Medication Import Helper!");
  
  rl.close();
}

// Only run the interactive mode if someone wants to use it directly
// Comment out the line below if you just want to import the functions
main().catch(console.error);

// Export functions and constants for use in other scripts
export {
  CATEGORIES,
  calculateDiscountPrice,
  formatPrice,
  saveMedicationsToJson
};