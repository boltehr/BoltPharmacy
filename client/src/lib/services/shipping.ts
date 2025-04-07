import { apiRequest } from "../queryClient";

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface PackageDetails {
  weight: number; // in pounds
  length: number; // in inches
  width: number;  // in inches
  height: number; // in inches
  value?: number; // declared value in USD
}

export interface ShippingRate {
  carrierId: string;
  carrierName: string;
  serviceName: string;
  serviceCode: string;
  price: number;
  estimatedDays: number;
  trackingAvailable: boolean;
}

export interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
  carrierId: string;
  carrierName: string;
}

export interface TrackingEvent {
  timestamp: string;
  description: string;
  location: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
}

export class ShippingService {
  /**
   * Get shipping rates for an address
   */
  async getShippingRates(
    destination: ShippingAddress,
    packageDetails?: PackageDetails
  ): Promise<ShippingRate[]> {
    try {
      const response = await apiRequest("POST", "/api/shipping/rates", {
        destination,
        packageDetails
      });
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching shipping rates:", error);
      throw new Error("Failed to get shipping rates");
    }
  }
  
  /**
   * Create a shipping label
   */
  async createShippingLabel(
    destination: ShippingAddress,
    carrierId: string,
    serviceCode: string,
    packageDetails?: PackageDetails
  ): Promise<ShippingLabel> {
    try {
      const response = await apiRequest("POST", "/api/shipping/label", {
        destination,
        carrierId,
        serviceCode,
        packageDetails
      });
      
      return await response.json();
    } catch (error) {
      console.error("Error creating shipping label:", error);
      throw new Error("Failed to create shipping label");
    }
  }
  
  /**
   * Track a package
   */
  async trackPackage(
    trackingNumber: string,
    carrierId: string,
    userId?: number
  ): Promise<TrackingInfo> {
    try {
      // Build tracking URL with query parameters
      let url = `/api/shipping/track/${trackingNumber}?carrier=${carrierId}`;
      
      // Add user ID if available for better tracking info
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      const response = await apiRequest("GET", url);
      return await response.json();
    } catch (error) {
      console.error("Error tracking package:", error);
      throw new Error("Failed to track package");
    }
  }
}

// Export a singleton instance
export const shippingService = new ShippingService();