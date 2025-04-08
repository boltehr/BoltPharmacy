# Medication Import Tools

These scripts help you prepare medication data for import into the BoltEHR Pharmacy Platform. They provide a structured way to manually collect and format medication information from legitimate sources.

## Important Legal Notice

**These scripts do NOT automatically scrape websites.** Automated scraping without permission may violate websites' terms of service and could potentially be illegal. Always:

1. Review and respect the terms of service of any website you gather data from
2. Collect data manually at a reasonable rate
3. Consider using official APIs if available
4. Attribute data sources appropriately

## Available Scripts

### 1. `medication-import-helper.js`

A simple script that demonstrates the expected format for medication data and provides a few examples.

```
node scripts/medication-import-helper.js
```

### 2. `medication-data-processor.js`

A more advanced script that helps format medication data with proper categorization and price calculations.

```
node scripts/medication-data-processor.js
```

### 3. `batch-medication-import.js`

An interactive script that guides you through entering medication information one by one and saves it to a JSON file.

```
node scripts/batch-medication-import.js
```

### 4. `import-medications.js`

A utility to directly import medications from your JSON file into the database (for admin use).

```
node scripts/import-medications.js
```

## How to Use These Tools

### Option 1: Manual Entry via Admin Interface
1. Manually collect medication information from legitimate sources (like Cost Plus Drugs website)
2. Run one of the scripts (1-3) above to format the data into a JSON file
3. Log in as an admin to the BoltEHR Pharmacy Platform
4. Navigate to Medication Management
5. Add each medication through the admin interface

### Option 2: Batch Import for Admins
1. Manually collect medication information from legitimate sources
2. Run one of the scripts (1-3) to generate `medications-for-import.json`
3. Run the import script (#4) to add all medications to the database at once:
   ```
   node scripts/import-medications.js
   ```

## Best Practices for Data Collection

When collecting medication data manually:

- Take brief notes of essential details only
- Collect public information only (don't try to access restricted areas)
- Space out your data collection over time to minimize server impact
- Consider reaching out to the website owner for permission or collaboration
- Ensure the accuracy of critical medical information

## Medication Data Format

Each medication should have the following information:

```javascript
{
  name: "Medication Name",
  genericName: "Generic Name",
  brandName: "Brand Name(s)",
  manufacturer: "Manufacturer Name",
  description: "Description of the medication and its uses",
  dosage: "Available dosages (e.g., 10mg, 20mg tablets)",
  category: "Medication Category",
  price: 19.99, // Original price
  discountPrice: 12.99, // Your platform's discounted price
  inStock: true,
  requiresPrescription: true,
  sideEffects: "Common side effects",
  warnings: "Important warnings",
  imageUrl: "/images/medications/default.jpg"
}
```

## Need More Help?

Contact your system administrator or developer for assistance with these scripts.
