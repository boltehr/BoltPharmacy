import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../queryClient";
import { useToast } from "@/hooks/use-toast";
import { WhiteLabel } from "@shared/schema";

type WhiteLabelContextType = {
  activeWhiteLabel: WhiteLabel | null;
  isLoading: boolean;
  error: Error | null;
  whiteLabels: WhiteLabel[];
  isWhiteLabelsLoading: boolean;
  whiteLabelsError: Error | null;
  createWhiteLabelMutation: any;
  updateWhiteLabelMutation: any;
  activateWhiteLabelMutation: any;
  deactivateWhiteLabelMutation: any;
};

export const WhiteLabelContext = createContext<WhiteLabelContextType | null>(null);

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Query for active white label configuration
  const {
    data: activeWhiteLabel,
    error,
    isLoading,
  } = useQuery<WhiteLabel | null, Error>({
    queryKey: ["/api/white-label/active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/white-label/active");
      if (res.status === 404) {
        return null;
      }
      return await res.json();
    },
  });

  // Query for all white label configurations (admin only)
  const {
    data: whiteLabels = [],
    error: whiteLabelsError,
    isLoading: isWhiteLabelsLoading,
  } = useQuery<WhiteLabel[], Error>({
    queryKey: ["/api/white-label"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/white-label");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return []; // Not authenticated or not authorized
        }
        throw new Error(`Failed to fetch white labels: ${res.statusText}`);
      }
      return await res.json();
    },
  });

  // Mutation for creating a new white label configuration
  const createWhiteLabelMutation = useMutation({
    mutationFn: async (data: Omit<WhiteLabel, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/white-label", data);
      if (!res.ok) {
        throw new Error(`Failed to create white label: ${res.statusText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "White label created",
        description: "The white label configuration has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label"] });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create white label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an existing white label configuration
  const updateWhiteLabelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WhiteLabel> }) => {
      const res = await apiRequest("PATCH", `/api/white-label/${id}`, data);
      if (!res.ok) {
        throw new Error(`Failed to update white label: ${res.statusText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "White label updated",
        description: "The white label configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label"] });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update white label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for activating a white label configuration
  const activateWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/white-label/${id}/activate`);
      if (!res.ok) {
        throw new Error(`Failed to activate white label: ${res.statusText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "White label activated",
        description: "The white label configuration has been activated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label"] });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to activate white label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deactivating a white label configuration
  const deactivateWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/white-label/${id}/deactivate`);
      if (!res.ok) {
        throw new Error(`Failed to deactivate white label: ${res.statusText}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "White label deactivated",
        description: "The white label configuration has been deactivated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label"] });
      queryClient.invalidateQueries({ queryKey: ["/api/white-label/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deactivate white label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <WhiteLabelContext.Provider
      value={{
        activeWhiteLabel: activeWhiteLabel || null,
        isLoading,
        error,
        whiteLabels,
        isWhiteLabelsLoading,
        whiteLabelsError,
        createWhiteLabelMutation,
        updateWhiteLabelMutation,
        activateWhiteLabelMutation,
        deactivateWhiteLabelMutation,
      }}
    >
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error("useWhiteLabel must be used within a WhiteLabelProvider");
  }
  return context;
}