import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "../queryClient";
import { WhiteLabel } from "@shared/schema";

// Helper function to convert hex color to HSL format for Tailwind CSS
const hexToHSL = (hex: string) => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find the maximum and minimum values to calculate the lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate the lightness
  const l = (max + min) / 2;
  
  let h, s;
  
  if (max === min) {
    // Achromatic case (gray)
    h = 0;
    s = 0;
  } else {
    // Calculate the saturation
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    // Calculate the hue
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }
  
  // Return HSL values in the correct format
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export interface WhiteLabelConfig {
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logo?: string;
  tagline?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  allowGuestCart?: boolean;
  fontFamily?: string;
  borderRadius?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  theme?: {
    borderRadius?: string;
    fontFamily?: string;
  };
}

export interface WhiteLabelContextType {
  config: WhiteLabelConfig | null;
  loading: boolean;
  error: Error | null;
  updateConfig: (config: Partial<WhiteLabelConfig>) => Promise<void>;
}

const defaultConfig: WhiteLabelConfig = {
  name: "BoltEHR Pharmacy",
  primaryColor: "#0070f3",
  tagline: "Your trusted online pharmacy for affordable medications",
  allowGuestCart: true,
};

export const WhiteLabelContext = createContext<WhiteLabelContextType>({
  config: defaultConfig,
  loading: false,
  error: null,
  updateConfig: async () => {},
});

export const WhiteLabelProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/white-labels/config");
        const data = await response.json();
        setConfig(data);
        
        // Apply white label styles to CSS variables
        if (data.primaryColor) {
          document.documentElement.style.setProperty(
            "--primary",
            hexToHSL(data.primaryColor)
          );
        }
        
        // Set secondary color if available
        if (data.secondaryColor) {
          document.documentElement.style.setProperty(
            "--secondary",
            hexToHSL(data.secondaryColor)
          );
        }
        
        // Set accent color if available
        if (data.accentColor) {
          document.documentElement.style.setProperty(
            "--accent",
            hexToHSL(data.accentColor)
          );
        }
        
        // Set border radius if available
        if (data.borderRadius) {
          document.documentElement.style.setProperty(
            "--radius",
            data.borderRadius
          );
        } else if (data.theme?.borderRadius) {
          document.documentElement.style.setProperty(
            "--radius",
            data.theme.borderRadius
          );
        }
        
        // Set font family if available
        if (data.fontFamily) {
          document.documentElement.style.setProperty(
            "--font-family",
            data.fontFamily
          );
        } else if (data.theme?.fontFamily) {
          document.documentElement.style.setProperty(
            "--font-family",
            data.theme.fontFamily
          );
        }

      } catch (err) {
        console.error("Error fetching white label config:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch config"));
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<WhiteLabelConfig>) => {
    try {
      setLoading(true);
      const response = await apiRequest("PATCH", "/api/white-labels/config", newConfig);
      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      
      // Apply white label styles to CSS variables
      if (updatedConfig.primaryColor) {
        document.documentElement.style.setProperty(
          "--primary",
          hexToHSL(updatedConfig.primaryColor)
        );
      }
      
      // Set secondary color if available
      if (updatedConfig.secondaryColor) {
        document.documentElement.style.setProperty(
          "--secondary",
          hexToHSL(updatedConfig.secondaryColor)
        );
      }
      
      // Set accent color if available
      if (updatedConfig.accentColor) {
        document.documentElement.style.setProperty(
          "--accent",
          hexToHSL(updatedConfig.accentColor)
        );
      }
      
      // Set border radius if available
      if (updatedConfig.borderRadius) {
        document.documentElement.style.setProperty(
          "--radius",
          updatedConfig.borderRadius
        );
      } else if (updatedConfig.theme?.borderRadius) {
        document.documentElement.style.setProperty(
          "--radius",
          updatedConfig.theme.borderRadius
        );
      }
      
      // Set font family if available
      if (updatedConfig.fontFamily) {
        document.documentElement.style.setProperty(
          "--font-family",
          updatedConfig.fontFamily
        );
      } else if (updatedConfig.theme?.fontFamily) {
        document.documentElement.style.setProperty(
          "--font-family",
          updatedConfig.theme.fontFamily
        );
      }
    } catch (err) {
      console.error("Error updating white label config:", err);
      setError(err instanceof Error ? err : new Error("Failed to update config"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WhiteLabelContext.Provider
      value={{
        config,
        loading,
        error,
        updateConfig,
      }}
    >
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error("useWhiteLabel must be used within a WhiteLabelProvider");
  }
  return context;
};