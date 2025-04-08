import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "../queryClient";
import { WhiteLabel } from "@shared/schema";

export interface WhiteLabelConfig {
  name: string;
  primaryColor: string;
  logo?: string;
  tagline?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  allowGuestCart?: boolean;
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
        
        // Apply primary color to CSS variables
        if (data.primaryColor) {
          document.documentElement.style.setProperty(
            "--primary",
            data.primaryColor
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
      
      // Apply primary color to CSS variables
      if (updatedConfig.primaryColor) {
        document.documentElement.style.setProperty(
          "--primary",
          updatedConfig.primaryColor
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