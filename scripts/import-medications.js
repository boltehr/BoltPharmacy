/**
 * Import Medications Script
 * 
 * This script imports medications from a JSON file directly into the database.
 * Run this script after you've collected medication data with the other helper scripts.
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../server/db.js';
import { medications } from '../shared/schema.js';
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(pool);

/**
 * Import medications from a JSON file into the database
 * @param {string} filename - JSON file containing medications
 */
async function importMedications(filename = 'medications-for-import.json') {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const medsToImport = JSON.parse(data);
    
    console.log(`Found ${medsToImport.length} medications to import`);
    
    // Import each medication
    for (const med of medsToImport) {
      try {
        // Check if medication already exists by name
        const existing = await db.select()
          .from(medications)
          .where(medications.name.equals(med.name))
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`Skipping ${med.name} - already exists in database`);
          continue;
        }
        
        // Insert the medication
        await db.insert(medications).values({
          name: med.name,
          genericName: med.genericName,
          brandName: med.brandName,
          manufacturer: med.manufacturer || "Various Manufacturers",
          description: med.description,
          dosage: med.dosage,
          category: med.category,
          price: med.price,
          discountPrice: med.discountPrice,
          inStock: med.inStock !== undefined ? med.inStock : true,
          requiresPrescription: med.requiresPrescription !== undefined ? med.requiresPrescription : true,
          sideEffects: med.sideEffects || "",
          warnings: med.warnings || "",
          imageUrl: med.imageUrl || "/images/medications/default.jpg"
        });
        
        console.log(`Imported: ${med.name}`);
      } catch (error) {
        console.error(`Error importing ${med.name}:`, error.message);
      }
    }
    
    console.log("Import complete!");
  } catch (error) {
    console.error("Import failed:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the import
importMedications().catch(console.error);