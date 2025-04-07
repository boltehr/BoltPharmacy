import axios from 'axios';
import crypto from 'crypto';

// Types for shipping service
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

// Carrier options
enum Carrier {
  UPS = 'ups',
  FEDEX = 'fedex'
}

// Common utility functions
function generateTrackingNumber(carrier: Carrier): string {
  const prefix = carrier === Carrier.UPS ? '1Z' : '7';
  const randomDigits = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return `${prefix}${randomDigits}`;
}

function calculateEstimatedDeliveryDays(serviceCode: string): number {
  switch (serviceCode) {
    case 'ground':
      return 3 + Math.floor(Math.random() * 3); // 3-5 days
    case 'threeday':
      return 3;
    case 'twoday':
      return 2;
    case 'overnight':
      return 1;
    default:
      return 3 + Math.floor(Math.random() * 5); // 3-7 days
  }
}

function calculateShippingPrice(
  serviceCode: string, 
  weight: number, 
  distance: number
): number {
  // Base pricing for different service levels
  const basePrices = {
    ground: 8.50,
    threeday: 12.75,
    twoday: 18.99,
    overnight: 29.99
  };
  
  // Get base price or default to ground
  const basePrice = basePrices[serviceCode as keyof typeof basePrices] || basePrices.ground;
  
  // Calculate price based on weight and distance factors
  const weightFactor = Math.max(1, weight * 0.75);
  const distanceFactor = Math.max(1, distance * 0.01);
  
  // Add some slight random variation to make prices realistic (+/- 5%)
  const variation = 0.95 + (Math.random() * 0.1);
  
  // Calculate final price and round to 2 decimal places
  return Math.round((basePrice * weightFactor * distanceFactor * variation) * 100) / 100;
}

// Simulate distance calculation between zip codes
function calculateDistanceBetweenZips(originZip: string, destinationZip: string): number {
  // In a real implementation, this would use a geolocation API
  // For demo purposes, create a pseudo-random but consistent distance
  const zipDiff = Math.abs(parseInt(originZip) - parseInt(destinationZip));
  const seed = parseInt(originZip.substring(0, 3)) + parseInt(destinationZip.substring(0, 3));
  return Math.min(2500, Math.max(50, (zipDiff * 3) + (seed % 500)));
}

/**
 * Shipping Service - Simulates integration with real shipping carriers
 * This implementation provides realistic behavior for demo purposes
 * but can be replaced with real API implementations in production
 */
export class ShippingService {
  private readonly PHARMACY_ZIP = '94107'; // San Francisco zip code
  private readonly PHARMACY_ADDRESS: ShippingAddress = {
    name: 'BoltEHR Pharmacy',
    street1: '123 Health St',
    city: 'San Francisco',
    state: 'CA',
    zip: this.PHARMACY_ZIP,
    country: 'US',
    phone: '4155550123'
  };

  // Default package details for medications (standard pill bottle)
  private readonly DEFAULT_PACKAGE: PackageDetails = {
    weight: 0.5,
    length: 4,
    width: 2,
    height: 2,
    value: 50
  };

  /**
   * Get shipping rates from multiple carriers
   */
  async getShippingRates(
    destination: ShippingAddress,
    packageDetails: PackageDetails = this.DEFAULT_PACKAGE
  ): Promise<ShippingRate[]> {
    try {
      // Calculate distance (for demo rate calculation)
      const distance = calculateDistanceBetweenZips(this.PHARMACY_ZIP, destination.zip);
      
      // Simulate network latency for a more realistic demo
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate rates for different carriers and service levels
      const rates: ShippingRate[] = [
        // UPS rates
        {
          carrierId: Carrier.UPS,
          carrierName: 'UPS',
          serviceCode: 'ground',
          serviceName: 'UPS Ground',
          price: calculateShippingPrice('ground', packageDetails.weight, distance),
          estimatedDays: calculateEstimatedDeliveryDays('ground'),
          trackingAvailable: true
        },
        {
          carrierId: Carrier.UPS,
          carrierName: 'UPS',
          serviceCode: 'twoday',
          serviceName: 'UPS 2nd Day Air',
          price: calculateShippingPrice('twoday', packageDetails.weight, distance),
          estimatedDays: calculateEstimatedDeliveryDays('twoday'),
          trackingAvailable: true
        },
        
        // FedEx rates
        {
          carrierId: Carrier.FEDEX,
          carrierName: 'FedEx',
          serviceCode: 'ground',
          serviceName: 'FedEx Ground',
          price: calculateShippingPrice('ground', packageDetails.weight, distance) * 0.95, // slightly cheaper than UPS
          estimatedDays: calculateEstimatedDeliveryDays('ground'),
          trackingAvailable: true
        },
        {
          carrierId: Carrier.FEDEX,
          carrierName: 'FedEx',
          serviceCode: 'overnight',
          serviceName: 'FedEx Overnight',
          price: calculateShippingPrice('overnight', packageDetails.weight, distance),
          estimatedDays: calculateEstimatedDeliveryDays('overnight'),
          trackingAvailable: true
        }
      ];
      
      return rates.sort((a, b) => a.price - b.price); // Sort by price
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      throw new Error('Unable to calculate shipping rates');
    }
  }

  /**
   * Create a shipping label for a specific carrier and service
   */
  async createShippingLabel(
    destination: ShippingAddress,
    carrierId: string,
    serviceCode: string,
    packageDetails: PackageDetails = this.DEFAULT_PACKAGE
  ): Promise<ShippingLabel> {
    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a unique tracking number
      const trackingNumber = generateTrackingNumber(carrierId as Carrier);
      
      // For demo purposes, create a "label URL" that would typically point to a PDF
      // In production, this would be a real URL from the carrier's API
      const labelHash = crypto.createHash('md5').update(`${destination.zip}-${trackingNumber}`).digest('hex');
      const labelUrl = `/api/shipping/labels/${labelHash}.pdf`;
      
      const carrierName = carrierId === Carrier.UPS ? 'UPS' : 'FedEx';
      
      return {
        trackingNumber,
        labelUrl,
        carrierId,
        carrierName
      };
    } catch (error) {
      console.error('Error creating shipping label:', error);
      throw new Error('Unable to create shipping label');
    }
  }

  /**
   * Track a package status
   */
  async trackPackage(
    trackingNumber: string,
    carrierId: string,
    destination?: ShippingAddress
  ): Promise<any> {
    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // For demo purposes, generate a realistic tracking status
      // In production, this would come from the carrier's API
      const carrierName = carrierId === Carrier.UPS ? 'UPS' : 'FedEx';
      const currentDate = new Date();
      
      // Generate a delivery date 3-5 days from "shipment"
      const deliveryDate = new Date(currentDate);
      deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 3));
      
      // Create events based on tracking number's "age" (using last 4 digits as days)
      const packageAgeDays = Math.min(5, parseInt(trackingNumber.substring(trackingNumber.length - 4)) % 6);
      
      const events = [];
      
      // Add shipment event
      const shipDate = new Date(currentDate);
      shipDate.setDate(shipDate.getDate() - packageAgeDays);
      events.push({
        timestamp: shipDate.toISOString(),
        description: 'Shipment information sent to carrier',
        location: 'San Francisco, CA'
      });
      
      if (packageAgeDays >= 1) {
        const pickupDate = new Date(shipDate);
        pickupDate.setHours(pickupDate.getHours() + 4);
        events.push({
          timestamp: pickupDate.toISOString(),
          description: 'Picked up by carrier',
          location: 'San Francisco, CA'
        });
      }
      
      if (packageAgeDays >= 2) {
        const departDate = new Date(shipDate);
        departDate.setDate(departDate.getDate() + 1);
        events.push({
          timestamp: departDate.toISOString(),
          description: 'Departed shipping facility',
          location: 'San Francisco, CA'
        });
      }
      
      if (packageAgeDays >= 3) {
        const transitDate = new Date(shipDate);
        transitDate.setDate(transitDate.getDate() + 2);
        events.push({
          timestamp: transitDate.toISOString(),
          description: 'In transit',
          location: 'Memphis, TN'
        });
      }
      
      if (packageAgeDays >= 4) {
        const arrivalDate = new Date(shipDate);
        arrivalDate.setDate(arrivalDate.getDate() + 3);
        events.push({
          timestamp: arrivalDate.toISOString(),
          description: 'Arrived at destination facility',
          location: destination?.city ? `${destination.city}, ${destination.state}` : 'Local Facility'
        });
      }
      
      if (packageAgeDays >= 5) {
        const deliveredDate = new Date(shipDate);
        deliveredDate.setDate(deliveredDate.getDate() + 4);
        events.push({
          timestamp: deliveredDate.toISOString(),
          description: 'Delivered',
          location: destination?.city ? `${destination.city}, ${destination.state}` : 'Destination'
        });
      }
      
      // Sort events by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        trackingNumber,
        carrier: carrierName,
        status: packageAgeDays >= 5 ? 'Delivered' : 'In Transit',
        estimatedDelivery: deliveryDate.toISOString(),
        events
      };
    } catch (error) {
      console.error('Error tracking package:', error);
      throw new Error('Unable to track package');
    }
  }
}

// For simplicity, export a singleton instance
export const shippingService = new ShippingService();