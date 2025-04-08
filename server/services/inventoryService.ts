/**
 * Inventory Management Service
 * 
 * This service handles the integration with external inventory systems like pharmacy
 * management software to fetch real-time inventory data.
 */
import axios from 'axios';
import { storage } from '../storage';
import {
  InventoryProvider,
  InventoryItem,
  InsertInventoryItem,
  InventoryMapping,
  InsertInventoryMapping,
  Medication
} from '@shared/schema';

// Types for API responses from different inventory systems
interface BaseInventoryResponse {
  success: boolean;
  message?: string;
}

interface GenericInventoryItem {
  id: string;
  name: string;
  description?: string;
  ndc?: string;
  quantity: number;
  unit?: string;
  price?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  location?: string;
  expirationDate?: string;
  inStock: boolean;
  reorderPoint?: number;
  reorderQuantity?: number;
  supplierInfo?: string;
  [key: string]: any; // Allow for additional fields in different systems
}

interface InventoryResponse extends BaseInventoryResponse {
  items?: GenericInventoryItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

interface InventoryStatusResponse extends BaseInventoryResponse {
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  errorMessage?: string;
}

/**
 * Inventory Management Service
 */
export class InventoryService {
  /**
   * Fetch inventory data from a specific provider
   */
  async fetchInventoryFromProvider(
    providerId: number, 
    options: { page?: number; pageSize?: number; search?: string } = {}
  ): Promise<InventoryResponse> {
    try {
      const provider = await storage.getInventoryProvider(providerId);
      if (!provider) {
        return { success: false, message: 'Inventory provider not found' };
      }

      if (!provider.isActive) {
        return { success: false, message: 'Inventory provider is inactive' };
      }

      // Call the appropriate connector based on provider type
      const response = await this.callProviderApi(provider, options);
      
      // Process and save inventory items
      if (response.success && response.items && response.items.length > 0) {
        await this.saveInventoryItems(provider.id, response.items);
      }

      // Update provider connection status
      await storage.updateInventoryProviderStatus(provider.id, {
        connectionStatus: response.success ? 'connected' : 'error',
        lastSyncDate: new Date()
      });

      return response;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Call provider API based on provider type
   */
  private async callProviderApi(
    provider: InventoryProvider, 
    options: { page?: number; pageSize?: number; search?: string }
  ): Promise<InventoryResponse> {
    const { page = 1, pageSize = 100, search } = options;
    const headers: Record<string, string> = {};
    
    // Set up authorization based on provider type
    if (provider.apiKey) {
      headers['x-api-key'] = provider.apiKey;
    }

    // Build query parameters
    const params: Record<string, any> = {
      page,
      limit: pageSize
    };

    if (search) {
      params.search = search;
    }
    
    try {
      // For demo/development, add a simulation mode
      if (provider.providerType === 'simulation') {
        return this.simulateInventoryData(provider, options);
      }

      // Real API call
      const response = await axios.get(`${provider.apiEndpoint}/inventory`, {
        headers,
        params
      });
      
      // Transform the response based on provider type
      return this.transformProviderResponse(provider.providerType, response.data);
    } catch (error) {
      console.error(`Error calling ${provider.name} API:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'API request failed' 
      };
    }
  }

  /**
   * Transform response data from different provider types to a standardized format
   */
  private transformProviderResponse(
    providerType: string, 
    responseData: any
  ): InventoryResponse {
    // Implementation would handle different formats for different providers
    // This is a simplified example that assumes a somewhat standard response format
    
    switch (providerType.toLowerCase()) {
      case 'rxware':
        // RxWare specific transformations
        return {
          success: true,
          items: (responseData.data || []).map((item: any) => ({
            id: item.inventoryId || item.id,
            name: item.productName || item.name,
            description: item.description,
            ndc: item.ndcNumber,
            quantity: parseInt(item.quantityOnHand || '0', 10),
            unit: item.dosageForm,
            price: parseFloat(item.awp || '0'),
            wholesalePrice: parseFloat(item.acquisitionCost || '0'),
            retailPrice: parseFloat(item.retailPrice || '0'),
            location: item.shelfLocation,
            inStock: parseInt(item.quantityOnHand || '0', 10) > 0,
            reorderPoint: parseInt(item.reorderPoint || '0', 10),
            reorderQuantity: parseInt(item.reorderQuantity || '0', 10),
            supplierInfo: item.primaryVendor,
            // Store the raw data
            rawData: item
          })),
          totalCount: responseData.totalCount || responseData.data?.length || 0,
          page: responseData.page || 1,
          pageSize: responseData.pageSize || responseData.data?.length || 0
        };
        
      case 'mckesson':
        // McKesson specific transformations
        return {
          success: true,
          items: (responseData.inventory || []).map((item: any) => ({
            id: item.sku || item.productId,
            name: item.productName,
            description: item.productDescription,
            ndc: item.ndc,
            quantity: parseInt(item.quantity || '0', 10),
            unit: item.unitOfMeasure,
            price: parseFloat(item.listPrice || '0'),
            wholesalePrice: parseFloat(item.wholesalePrice || '0'),
            retailPrice: parseFloat(item.suggestedRetailPrice || '0'),
            location: item.warehouseLocation,
            inStock: item.inStock === true || parseInt(item.quantity || '0', 10) > 0,
            reorderPoint: parseInt(item.minimumOrderQuantity || '0', 10),
            reorderQuantity: parseInt(item.standardOrderQuantity || '0', 10),
            supplierInfo: item.manufacturer,
            // Store the raw data
            rawData: item
          })),
          totalCount: responseData.totalResults || responseData.inventory?.length || 0,
          page: responseData.currentPage || 1,
          pageSize: responseData.pageSize || responseData.inventory?.length || 0
        };
        
      case 'pioneerrx':
        // PioneerRx specific transformations
        return {
          success: true,
          items: (responseData.items || []).map((item: any) => ({
            id: item.itemId || item.id,
            name: item.drugName || item.name,
            description: item.description,
            ndc: item.nationalDrugCode,
            quantity: parseInt(item.stockQuantity || '0', 10),
            unit: item.packageSize,
            price: parseFloat(item.awpPrice || '0'),
            wholesalePrice: parseFloat(item.costPrice || '0'),
            retailPrice: parseFloat(item.sellingPrice || '0'),
            location: item.binLocation,
            inStock: item.hasStock === true || parseInt(item.stockQuantity || '0', 10) > 0,
            reorderPoint: parseInt(item.reorderLevel || '0', 10),
            reorderQuantity: parseInt(item.orderQuantity || '0', 10),
            supplierInfo: item.primaryVendor,
            // Store the raw data
            rawData: item
          })),
          totalCount: responseData.totalItems || responseData.items?.length || 0,
          page: responseData.page || 1,
          pageSize: responseData.limit || responseData.items?.length || 0
        };
        
      case 'cardinal':
        // Cardinal Health specific transformations
        return {
          success: true,
          items: (responseData.products || []).map((item: any) => ({
            id: item.productId || item.id,
            name: item.name,
            description: item.description,
            ndc: item.ndcNumber,
            quantity: parseInt(item.inventoryLevel || '0', 10),
            unit: item.unitOfMeasure,
            price: parseFloat(item.contractPrice || '0'),
            wholesalePrice: parseFloat(item.wholesaleAcquisitionCost || '0'),
            retailPrice: parseFloat(item.suggestedRetailPrice || '0'),
            location: item.storageLocation,
            inStock: item.available === true || parseInt(item.inventoryLevel || '0', 10) > 0,
            reorderPoint: parseInt(item.parLevel || '0', 10),
            reorderQuantity: parseInt(item.orderQuantity || '0', 10),
            supplierInfo: item.manufacturer,
            // Store the raw data
            rawData: item
          })),
          totalCount: responseData.totalCount || responseData.products?.length || 0,
          page: responseData.pageNumber || 1,
          pageSize: responseData.pageSize || responseData.products?.length || 0
        };
      
      case 'simulation':
        // Handle the simulation response from simulateInventoryData
        // This should already be in the correct format
        return responseData;
        
      default:
        // Generic handling for unknown provider types
        console.warn(`Unknown provider type: ${providerType}, using generic transformation`);
        const items = Array.isArray(responseData.data || responseData.items || responseData)
          ? (responseData.data || responseData.items || responseData)
          : [];
          
        return {
          success: true,
          items: items.map((item: any) => ({
            id: item.id || item.inventoryId || item.productId,
            name: item.name || item.productName || item.drugName,
            description: item.description,
            ndc: item.ndc || item.ndcNumber || item.nationalDrugCode,
            quantity: parseInt(item.quantity || item.stockQuantity || item.inventoryLevel || '0', 10),
            unit: item.unit || item.unitOfMeasure || item.packageSize,
            price: parseFloat(item.price || item.listPrice || item.awpPrice || '0'),
            wholesalePrice: parseFloat(item.wholesalePrice || item.costPrice || '0'),
            retailPrice: parseFloat(item.retailPrice || item.sellingPrice || item.suggestedRetailPrice || '0'),
            inStock: item.inStock === true || 
                    item.hasStock === true || 
                    item.available === true ||
                    parseInt(item.quantity || item.stockQuantity || item.inventoryLevel || '0', 10) > 0,
            // Store the raw data
            rawData: item
          })),
          totalCount: responseData.totalCount || responseData.totalItems || items.length,
          page: responseData.page || responseData.pageNumber || 1,
          pageSize: responseData.pageSize || responseData.limit || items.length
        };
    }
  }

  /**
   * Simulate inventory data for development/demo purposes
   */
  private simulateInventoryData(
    provider: InventoryProvider,
    options: { page?: number; pageSize?: number; search?: string }
  ): InventoryResponse {
    const { page = 1, pageSize = 100, search } = options;
    
    // Get some medications to base our simulation on
    let medications = storage.getAllMedicationsSync();
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      medications = medications.filter(med => 
        med.name.toLowerCase().includes(searchLower) || 
        (med.genericName && med.genericName.toLowerCase().includes(searchLower)) ||
        (med.brandName && med.brandName.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate pagination
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedMeds = medications.slice(startIdx, endIdx);
    
    // Generate simulated inventory items based on our medications
    const items: GenericInventoryItem[] = paginatedMeds.map(med => {
      // Generate some reasonable random values for the simulation
      const quantity = Math.floor(Math.random() * 100) + 1;
      const wholesalePrice = med.price * 0.7; // 70% of retail as wholesale price
      
      return {
        id: `SIM-${med.id}`,
        name: med.name,
        description: med.description || `${med.name} ${med.dosage || ''}`,
        ndc: `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
        quantity,
        unit: "tablets",
        price: med.price,
        wholesalePrice,
        retailPrice: med.retailPrice || med.price * 1.2,
        location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 20) + 1}`,
        inStock: quantity > 0,
        reorderPoint: 10,
        reorderQuantity: 50,
        supplierInfo: med.brandName || "Generic Supplier",
        // Create some random raw data that might come from an external system
        rawData: {
          drugId: `${provider.providerType.substring(0, 3).toUpperCase()}-${med.id}`,
          lastUpdated: new Date().toISOString(),
          batchNumber: `BN-${Math.floor(100000 + Math.random() * 900000)}`,
          // Add more simulated raw data here
        }
      };
    });
    
    return {
      success: true,
      items,
      totalCount: medications.length,
      page,
      pageSize
    };
  }

  /**
   * Save inventory items to database
   */
  private async saveInventoryItems(
    providerId: number, 
    items: GenericInventoryItem[]
  ): Promise<void> {
    for (const item of items) {
      // Check if item already exists
      const existingItem = await storage.getInventoryItemByExternalId(providerId, item.id);
      
      if (existingItem) {
        // Update existing item
        await storage.updateInventoryItem(existingItem.id, {
          name: item.name,
          description: item.description,
          externalNdc: item.ndc,
          inStock: item.inStock,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          wholesalePrice: item.wholesalePrice,
          retailPrice: item.retailPrice,
          location: item.location,
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
          supplierInfo: item.supplierInfo,
          rawData: item.rawData || item
        });
      } else {
        // Create new item
        const newItem: InsertInventoryItem = {
          providerId,
          externalId: item.id,
          externalNdc: item.ndc,
          name: item.name,
          description: item.description,
          inStock: item.inStock,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          wholesalePrice: item.wholesalePrice,
          retailPrice: item.retailPrice,
          location: item.location,
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
          supplierInfo: item.supplierInfo,
          rawData: item.rawData || item
        };
        
        await storage.createInventoryItem(newItem);
      }
    }
  }

  /**
   * Map inventory items to medications
   */
  async mapInventoryItemToMedication(
    inventoryItemId: number,
    medicationId: number,
    options: { isPrimary?: boolean; mappingType?: string; confidence?: number } = {}
  ): Promise<InventoryMapping | undefined> {
    const { isPrimary = false, mappingType = 'manual', confidence = 1.0 } = options;
    
    // Check if the mapping already exists
    const existingMapping = await storage.getInventoryMappingByItemAndMedication(
      inventoryItemId,
      medicationId
    );
    
    if (existingMapping) {
      // Update existing mapping
      return storage.updateInventoryMapping(existingMapping.id, {
        isPrimary,
        mappingType,
        mappingConfidence: confidence,
        mappingStatus: 'active'
      });
    } else {
      // Create new mapping
      const mapping: InsertInventoryMapping = {
        inventoryItemId,
        medicationId,
        isPrimary,
        mappingType,
        mappingConfidence: confidence,
        mappingStatus: 'active'
      };
      
      return storage.createInventoryMapping(mapping);
    }
  }

  /**
   * Auto-map inventory items to medications based on name similarity
   */
  async autoMapInventoryItems(providerId: number): Promise<{ 
    mapped: number; 
    total: number;
    medications: { medicationId: number; medicationName: string; inventoryItems: string[] }[];
  }> {
    // Get all inventory items for the provider
    const items = await storage.getInventoryItemsByProvider(providerId);
    
    // Get all medications
    const medications = storage.getAllMedicationsSync();
    
    let mappedCount = 0;
    const mappedMedications: { 
      medicationId: number; 
      medicationName: string; 
      inventoryItems: string[];
    }[] = [];
    
    // Simple mapping logic based on name similarity
    // In a real system this would use more sophisticated matching algorithms
    for (const medication of medications) {
      const mappedItems: string[] = [];
      
      // Normalize medication names for comparison
      const medNameLower = medication.name.toLowerCase();
      const genericNameLower = medication.genericName?.toLowerCase() || '';
      const brandNameLower = medication.brandName?.toLowerCase() || '';
      
      for (const item of items) {
        const itemNameLower = item.name.toLowerCase();
        
        // Calculate simple string similarity
        const matchMedName = this.calculateStringSimilarity(medNameLower, itemNameLower);
        const matchGenericName = genericNameLower ? 
          this.calculateStringSimilarity(genericNameLower, itemNameLower) : 0;
        const matchBrandName = brandNameLower ? 
          this.calculateStringSimilarity(brandNameLower, itemNameLower) : 0;
        
        // Use the highest similarity score
        const similarity = Math.max(matchMedName, matchGenericName, matchBrandName);
        
        // If similarity is above threshold, create a mapping
        if (similarity >= 0.7) {  // 70% similarity threshold
          await this.mapInventoryItemToMedication(
            item.id,
            medication.id,
            {
              isPrimary: true,  // Mark as primary if it's the best match
              mappingType: 'automatic',
              confidence: similarity
            }
          );
          
          mappedCount++;
          mappedItems.push(item.name);
        }
      }
      
      if (mappedItems.length > 0) {
        mappedMedications.push({
          medicationId: medication.id,
          medicationName: medication.name,
          inventoryItems: mappedItems
        });
      }
    }
    
    return {
      mapped: mappedCount,
      total: items.length,
      medications: mappedMedications
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns a value between 0 and 1, where 1 is a perfect match
   */
  private calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    // Check if one string contains the other
    if (a.includes(b) || b.includes(a)) {
      return 0.9; // High similarity for substrings
    }
    
    // Simple word match
    const aWords = a.split(/\s+/);
    const bWords = b.split(/\s+/);
    
    // Count matching words
    let matchingWords = 0;
    for (const aWord of aWords) {
      if (bWords.some(bWord => aWord === bWord)) {
        matchingWords++;
      }
    }
    
    // Calculate Jaccard index for word similarity
    const totalUniqueWords = new Set([...aWords, ...bWords]).size;
    return matchingWords / totalUniqueWords;
  }

  /**
   * Get medications with inventory information
   */
  async getMedicationsWithInventory(
    options: { page?: number; pageSize?: number; categoryId?: number; inStockOnly?: boolean } = {}
  ): Promise<{ 
    medications: (Medication & { inventoryStatus: { 
      inStock: boolean; 
      totalQuantity: number;
      sources: { 
        id: number; 
        providerName: string; 
        quantity: number;
        location?: string;
      }[];
    } })[];
    total: number;
  }> {
    const { page = 1, pageSize = 20, categoryId, inStockOnly = false } = options;
    
    // Get medications
    const { medications, total } = await storage.getMedicationsPaginated({
      page,
      pageSize,
      categoryId,
      withInventory: true
    });
    
    // Enhance medications with inventory data
    const medicationsWithInventory = await Promise.all(
      medications.map(async (medication) => {
        // Get inventory mappings for this medication
        const mappings = await storage.getInventoryMappingsByMedication(medication.id);
        
        // Default inventory status if no mappings
        let inventoryStatus = {
          inStock: medication.inStock,
          totalQuantity: 0,
          sources: [] as { id: number; providerName: string; quantity: number; location?: string; }[]
        };
        
        if (mappings.length > 0) {
          // Get inventory items for each mapping
          const inventoryItems = await Promise.all(
            mappings.map(mapping => storage.getInventoryItem(mapping.inventoryItemId))
          );
          
          // Get provider info for each inventory item
          const providers = await Promise.all(
            inventoryItems
              .filter(item => item !== undefined)
              .map(item => storage.getInventoryProvider(item!.providerId))
          );
          
          // Calculate inventory status
          let totalQuantity = 0;
          const sources: { id: number; providerName: string; quantity: number; location?: string; }[] = [];
          
          inventoryItems.forEach((item, index) => {
            if (item && providers[index]) {
              totalQuantity += item.quantity || 0;
              
              sources.push({
                id: item.id,
                providerName: providers[index]!.name,
                quantity: item.quantity || 0,
                location: item.location
              });
            }
          });
          
          inventoryStatus = {
            inStock: totalQuantity > 0,
            totalQuantity,
            sources
          };
        }
        
        return {
          ...medication,
          inventoryStatus
        };
      })
    );
    
    // Filter by inStock if requested
    const filteredMedications = inStockOnly 
      ? medicationsWithInventory.filter(med => med.inventoryStatus.inStock) 
      : medicationsWithInventory;
    
    return {
      medications: filteredMedications,
      total: inStockOnly ? filteredMedications.length : total
    };
  }

  /**
   * Check connection status with inventory provider
   */
  async checkProviderConnection(providerId: number): Promise<InventoryStatusResponse> {
    try {
      const provider = await storage.getInventoryProvider(providerId);
      if (!provider) {
        return { 
          success: false, 
          status: 'error',
          message: 'Inventory provider not found' 
        };
      }

      if (!provider.isActive) {
        return { 
          success: false, 
          status: 'disconnected',
          message: 'Inventory provider is inactive' 
        };
      }

      // For simulation provider, always return connected
      if (provider.providerType === 'simulation') {
        return {
          success: true,
          status: 'connected',
          lastSync: provider.lastSyncDate?.toISOString()
        };
      }

      // Test connection by making a simple request
      try {
        const response = await axios.get(`${provider.apiEndpoint}/status`, {
          headers: provider.apiKey ? { 'x-api-key': provider.apiKey } : {},
          timeout: 5000 // 5 second timeout for quick connection test
        });
        
        // Update the provider status in the database
        await storage.updateInventoryProviderStatus(provider.id, {
          connectionStatus: 'connected'
        });
        
        return {
          success: true,
          status: 'connected',
          lastSync: provider.lastSyncDate?.toISOString()
        };
      } catch (error) {
        // Update the provider status in the database
        await storage.updateInventoryProviderStatus(provider.id, {
          connectionStatus: 'error'
        });
        
        return {
          success: false,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown connection error',
          errorMessage: error instanceof Error ? error.message : 'Unknown connection error'
        };
      }
    } catch (error) {
      console.error('Error checking provider connection:', error);
      return { 
        success: false, 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();