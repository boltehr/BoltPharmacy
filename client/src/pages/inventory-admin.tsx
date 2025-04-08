import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/context/auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, PlusCircle, RefreshCw, X } from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

type InventoryProvider = {
  id: number;
  name: string;
  apiEndpoint: string;
  apiKey?: string;
  apiSecret?: string;
  description?: string;
  providerType: string;
  isActive: boolean;
  connectionStatus: string;
  lastSyncDate?: string;
  syncFrequency: string;
  syncSchedule?: string;
  createdAt: string;
  updatedAt: string;
};

type InventoryItem = {
  id: number;
  providerId: number;
  externalId: string;
  externalNdc?: string;
  name: string;
  description?: string;
  inStock: boolean;
  quantity: number;
  unit?: string;
  price?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  location?: string;
  expirationDate?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  supplierInfo?: string;
  lastUpdated: string;
  rawData?: any;
};

type InventoryMapping = {
  id: number;
  medicationId: number;
  inventoryItemId: number;
  isPrimary: boolean;
  mappingType: string;
  mappingStatus: string;
  mappingConfidence?: number;
  createdAt: string;
  updatedAt: string;
  medication?: {
    id: number;
    name: string;
    genericName?: string;
    brandName?: string;
  };
  inventoryItem?: {
    id: number;
    name: string;
    externalId: string;
    providerId: number;
  };
  provider?: {
    id: number;
    name: string;
    providerType: string;
  };
};

type Medication = {
  id: number;
  name: string;
  genericName?: string;
  brandName?: string;
  description?: string;
  price: number;
  retailPrice?: number;
  category?: string;
};

// Form Schemas
const providerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  apiEndpoint: z.string().url({ message: "Must be a valid URL" }),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  description: z.string().optional(),
  providerType: z.string().min(2, { message: "Provider type is required" }),
  isActive: z.boolean().default(true),
  syncFrequency: z.string().default("daily"),
  syncSchedule: z.string().optional()
});

const itemFormSchema = z.object({
  providerId: z.number().min(1, { message: "Provider is required" }),
  externalId: z.string().min(1, { message: "External ID is required" }),
  externalNdc: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  inStock: z.boolean().default(true),
  quantity: z.number().nonnegative({ message: "Quantity must be non-negative" }).default(0),
  unit: z.string().optional(),
  price: z.number().nonnegative({ message: "Price must be non-negative" }).optional(),
  wholesalePrice: z.number().nonnegative({ message: "Wholesale price must be non-negative" }).optional(),
  retailPrice: z.number().nonnegative({ message: "Retail price must be non-negative" }).optional(),
  location: z.string().optional(),
  expirationDate: z.string().optional(),
  reorderPoint: z.number().nonnegative({ message: "Reorder point must be non-negative" }).optional(),
  reorderQuantity: z.number().nonnegative({ message: "Reorder quantity must be non-negative" }).optional(),
  supplierInfo: z.string().optional()
});

const mappingFormSchema = z.object({
  medicationId: z.number().min(1, { message: "Medication is required" }),
  inventoryItemId: z.number().min(1, { message: "Inventory item is required" }),
  isPrimary: z.boolean().default(false),
  mappingType: z.string().default("manual"),
  mappingStatus: z.string().default("active"),
  mappingConfidence: z.number().min(0).max(1).optional()
});

export default function InventoryAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("providers");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [medicationId, setMedicationId] = useState<number | null>(null);
  const [mappingId, setMappingId] = useState<number | null>(null);
  
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);

  // If not admin, redirect to home
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Multi-Vendor Inventory Management</h1>
      
      <Tabs defaultValue="providers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Inventory Providers</TabsTrigger>
          <TabsTrigger value="items">Inventory Items</TabsTrigger>
          <TabsTrigger value="mappings">Medication Mappings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="pt-4">
          <ProvidersTab 
            openDialog={() => {
              setIsEditing(false);
              setProviderId(null);
              setIsProviderDialogOpen(true);
            }}
            editProvider={(id) => {
              setIsEditing(true);
              setProviderId(id);
              setIsProviderDialogOpen(true);
            }}
          />
          
          <ProviderFormDialog
            isOpen={isProviderDialogOpen}
            onOpenChange={setIsProviderDialogOpen}
            providerId={providerId}
            isEditing={isEditing}
          />
        </TabsContent>
        
        <TabsContent value="items" className="pt-4">
          <ItemsTab 
            openDialog={() => {
              setIsEditing(false);
              setItemId(null);
              setIsItemDialogOpen(true);
            }}
            editItem={(id) => {
              setIsEditing(true);
              setItemId(id);
              setIsItemDialogOpen(true);
            }}
            providerId={providerId}
            setProviderId={setProviderId}
          />
          
          <ItemFormDialog
            isOpen={isItemDialogOpen}
            onOpenChange={setIsItemDialogOpen}
            itemId={itemId}
            isEditing={isEditing}
            initialProviderId={providerId}
          />
        </TabsContent>
        
        <TabsContent value="mappings" className="pt-4">
          <MappingsTab 
            openDialog={() => {
              setIsEditing(false);
              setMappingId(null);
              setIsMappingDialogOpen(true);
            }}
            editMapping={(id) => {
              setIsEditing(true);
              setMappingId(id);
              setIsMappingDialogOpen(true);
            }}
            medicationId={medicationId}
            setMedicationId={setMedicationId}
          />
          
          <MappingFormDialog
            isOpen={isMappingDialogOpen}
            onOpenChange={setIsMappingDialogOpen}
            mappingId={mappingId}
            isEditing={isEditing}
            initialMedicationId={medicationId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Providers Tab Component
function ProvidersTab({ openDialog, editProvider }: { openDialog: () => void, editProvider: (id: number) => void }) {
  const [filter, setFilter] = useState("all"); // all, active, inactive
  
  const providersQuery = useQuery({
    queryKey: ["/api/inventory/providers"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inventory/providers');
      return await res.json() as InventoryProvider[];
    }
  });
  
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/inventory/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/providers"] });
      toast({
        title: "Provider deleted",
        description: "The inventory provider has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting provider",
        description: error.message || "There was an error deleting the provider."
      });
    }
  });
  
  const toggleProviderStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      return await apiRequest('PUT', `/api/inventory/providers/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/providers"] });
      toast({
        title: "Provider status updated",
        description: "The inventory provider status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating provider status",
        description: error.message || "There was an error updating the provider status."
      });
    }
  });
  
  const displayProviders = providersQuery.data
    ? providersQuery.data.filter(provider => {
        if (filter === "active") return provider.isActive;
        if (filter === "inactive") return !provider.isActive;
        return true;
      })
    : [];
  
  if (providersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (providersQuery.isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load inventory providers. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleDeleteProvider = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      deleteProviderMutation.mutate(id);
    }
  };
  
  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleProviderStatusMutation.mutate({ id, isActive: !currentStatus });
  };
  
  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Label htmlFor="filter">Filter:</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openDialog}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>
      
      {displayProviders.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/50">
          <p className="text-muted-foreground">No inventory providers found. Add your first provider to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayProviders.map(provider => (
            <Card key={provider.id} className={!provider.isActive ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {provider.name}
                    </CardTitle>
                    <CardDescription>{provider.providerType}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {provider.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-muted-foreground">Connection:</div>
                  <div className="font-medium">
                    {provider.connectionStatus === "connected" ? (
                      <span className="text-green-600">Connected</span>
                    ) : provider.connectionStatus === "error" ? (
                      <span className="text-red-600">Error</span>
                    ) : (
                      <span className="text-amber-600">Disconnected</span>
                    )}
                  </div>
                  
                  <div className="text-muted-foreground">Last Sync:</div>
                  <div>
                    {provider.lastSyncDate 
                      ? new Date(provider.lastSyncDate).toLocaleString() 
                      : "Never"}
                  </div>
                  
                  <div className="text-muted-foreground">Sync Frequency:</div>
                  <div>{provider.syncFrequency}</div>
                  
                  {provider.description && (
                    <>
                      <div className="text-muted-foreground">Description:</div>
                      <div>{provider.description}</div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`active-${provider.id}`} className="text-xs">Active</Label>
                  <Switch 
                    id={`active-${provider.id}`} 
                    checked={provider.isActive}
                    onCheckedChange={() => handleToggleStatus(provider.id, provider.isActive)}
                  />
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => editProvider(provider.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                    disabled={deleteProviderMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Provider Form Dialog
function ProviderFormDialog({ 
  isOpen, 
  onOpenChange, 
  providerId, 
  isEditing 
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void,
  providerId: number | null,
  isEditing: boolean
}) {
  const providerQuery = useQuery({
    queryKey: ["/api/inventory/providers", providerId],
    queryFn: async () => {
      if (!providerId) return null;
      const res = await apiRequest('GET', `/api/inventory/providers/${providerId}`);
      return await res.json() as InventoryProvider;
    },
    enabled: !!providerId && isEditing
  });
  
  const form = useForm<z.infer<typeof providerFormSchema>>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: "",
      apiEndpoint: "",
      apiKey: "",
      apiSecret: "",
      description: "",
      providerType: "",
      isActive: true,
      syncFrequency: "daily",
      syncSchedule: ""
    }
  });
  
  // Set form values when editing
  useEffect(() => {
    if (providerQuery.data && isEditing) {
      const provider = providerQuery.data;
      form.reset({
        name: provider.name,
        apiEndpoint: provider.apiEndpoint,
        apiKey: provider.apiKey || "",
        apiSecret: provider.apiSecret || "",
        description: provider.description || "",
        providerType: provider.providerType,
        isActive: provider.isActive,
        syncFrequency: provider.syncFrequency,
        syncSchedule: provider.syncSchedule || ""
      });
    } else if (!isEditing) {
      form.reset({
        name: "",
        apiEndpoint: "",
        apiKey: "",
        apiSecret: "",
        description: "",
        providerType: "",
        isActive: true,
        syncFrequency: "daily",
        syncSchedule: ""
      });
    }
  }, [providerQuery.data, isEditing, form, isOpen]);
  
  const createProviderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof providerFormSchema>) => {
      const res = await apiRequest('POST', '/api/inventory/providers', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/providers"] });
      onOpenChange(false);
      toast({
        title: "Provider created",
        description: "The inventory provider has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating provider",
        description: error.message || "There was an error creating the provider."
      });
    }
  });
  
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof providerFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/inventory/providers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/providers"] });
      onOpenChange(false);
      toast({
        title: "Provider updated",
        description: "The inventory provider has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating provider",
        description: error.message || "There was an error updating the provider."
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof providerFormSchema>) => {
    if (isEditing && providerId) {
      updateProviderMutation.mutate({ id: providerId, data });
    } else {
      createProviderMutation.mutate(data);
    }
  };
  
  const isPending = createProviderMutation.isPending || updateProviderMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Provider" : "Add New Provider"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update inventory provider details." 
              : "Add a new inventory provider to the system."}
          </DialogDescription>
        </DialogHeader>
        
        {isEditing && providerQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Provider name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="providerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RxWare">RxWare</SelectItem>
                          <SelectItem value="McKesson">McKesson</SelectItem>
                          <SelectItem value="PioneerRx">PioneerRx</SelectItem>
                          <SelectItem value="Cardinal">Cardinal</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="apiEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Endpoint</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.provider.com/v1" {...field} />
                    </FormControl>
                    <FormDescription>
                      The base URL for the provider's API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="syncFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sync Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="real-time">Real-time</SelectItem>
                          <SelectItem value="manual">Manual only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="syncSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sync Schedule</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 00:00 or cron syntax" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional time or cron expression
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active
                      </FormLabel>
                      <FormDescription>
                        Set whether this provider is active and can be used for inventory
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Update Provider" : "Add Provider"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Items Tab Component
function ItemsTab({ 
  openDialog, 
  editItem,
  providerId,
  setProviderId
}: { 
  openDialog: () => void, 
  editItem: (id: number) => void,
  providerId: number | null,
  setProviderId: (id: number | null) => void
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const providersQuery = useQuery({
    queryKey: ["/api/inventory/providers"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inventory/providers');
      return await res.json() as InventoryProvider[];
    }
  });
  
  const itemsQuery = useQuery({
    queryKey: ["/api/inventory/items", providerId],
    queryFn: async () => {
      const url = providerId 
        ? `/api/inventory/items?providerId=${providerId}` 
        : '/api/inventory/items';
      const res = await apiRequest('GET', url);
      return await res.json() as InventoryItem[];
    }
  });
  
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/inventory/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      toast({
        title: "Item deleted",
        description: "The inventory item has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting item",
        description: error.message || "There was an error deleting the item."
      });
    }
  });
  
  const filteredItems = itemsQuery.data
    ? itemsQuery.data.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.externalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.externalNdc && item.externalNdc.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];
  
  const activeProviders = providersQuery.data
    ? providersQuery.data.filter(p => p.isActive)
    : [];
  
  if (providersQuery.isLoading || itemsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (providersQuery.isError || itemsQuery.isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load inventory data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this inventory item?")) {
      deleteItemMutation.mutate(id);
    }
  };
  
  const providerName = providerId 
    ? providersQuery.data?.find(p => p.id === providerId)?.name || "Unknown Provider"
    : "All Providers";
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="provider-filter">Provider:</Label>
            <Select 
              value={providerId?.toString() || "all"} 
              onValueChange={(value) => setProviderId(value === "all" ? null : Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {activeProviders.map(provider => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        
        <Button onClick={openDialog}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Inventory Item
        </Button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <span>Inventory Items</span>
          <span className="text-sm ml-2 text-muted-foreground">({providerName})</span>
        </h2>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/50">
          <p className="text-muted-foreground">
            {searchTerm
              ? "No items match your search."
              : providerId
                ? "No inventory items found for this provider. Add your first item to get started."
                : "No inventory items found. Add your first item to get started."}
          </p>
        </div>
      ) : (
        <Table>
          <TableCaption>
            Showing {filteredItems.length} inventory items
            {providerId ? ` for ${providerName}` : ""}
            {searchTerm ? ` matching "${searchTerm}"` : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>External ID</TableHead>
              <TableHead>NDC</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.externalId}</TableCell>
                <TableCell>{item.externalNdc || '-'}</TableCell>
                <TableCell className="text-right">{item.quantity} {item.unit || ''}</TableCell>
                <TableCell className="text-right">
                  {item.price 
                    ? `$${item.price.toFixed(2)}` 
                    : item.retailPrice 
                      ? `$${item.retailPrice.toFixed(2)}` 
                      : '-'}
                </TableCell>
                <TableCell>
                  {item.inStock ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      In Stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      Out of Stock
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => editItem(item.id)}>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deleteItemMutation.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Item Form Dialog
function ItemFormDialog({ 
  isOpen, 
  onOpenChange, 
  itemId, 
  isEditing,
  initialProviderId
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void,
  itemId: number | null,
  isEditing: boolean,
  initialProviderId: number | null
}) {
  const itemQuery = useQuery({
    queryKey: ["/api/inventory/items", itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const res = await apiRequest('GET', `/api/inventory/items/${itemId}`);
      return await res.json() as InventoryItem;
    },
    enabled: !!itemId && isEditing
  });
  
  const providersQuery = useQuery({
    queryKey: ["/api/inventory/providers"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inventory/providers?active=true');
      return await res.json() as InventoryProvider[];
    }
  });
  
  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      providerId: initialProviderId || 0,
      externalId: "",
      externalNdc: "",
      name: "",
      description: "",
      inStock: true,
      quantity: 0,
      unit: "",
      price: undefined,
      wholesalePrice: undefined,
      retailPrice: undefined,
      location: "",
      expirationDate: "",
      reorderPoint: undefined,
      reorderQuantity: undefined,
      supplierInfo: ""
    }
  });
  
  // Set form values when editing or when provider changes
  useEffect(() => {
    if (itemQuery.data && isEditing) {
      const item = itemQuery.data;
      form.reset({
        providerId: item.providerId,
        externalId: item.externalId,
        externalNdc: item.externalNdc || "",
        name: item.name,
        description: item.description || "",
        inStock: item.inStock,
        quantity: item.quantity,
        unit: item.unit || "",
        price: item.price,
        wholesalePrice: item.wholesalePrice,
        retailPrice: item.retailPrice,
        location: item.location || "",
        expirationDate: item.expirationDate || "",
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        supplierInfo: item.supplierInfo || ""
      });
    } else if (!isEditing) {
      form.reset({
        providerId: initialProviderId || 0,
        externalId: "",
        externalNdc: "",
        name: "",
        description: "",
        inStock: true,
        quantity: 0,
        unit: "",
        price: undefined,
        wholesalePrice: undefined,
        retailPrice: undefined,
        location: "",
        expirationDate: "",
        reorderPoint: undefined,
        reorderQuantity: undefined,
        supplierInfo: ""
      });
    }
  }, [itemQuery.data, isEditing, form, isOpen, initialProviderId]);
  
  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itemFormSchema>) => {
      const res = await apiRequest('POST', '/api/inventory/items', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      onOpenChange(false);
      toast({
        title: "Item created",
        description: "The inventory item has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating item",
        description: error.message || "There was an error creating the inventory item."
      });
    }
  });
  
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof itemFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/inventory/items/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      onOpenChange(false);
      toast({
        title: "Item updated",
        description: "The inventory item has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating item",
        description: error.message || "There was an error updating the inventory item."
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof itemFormSchema>) => {
    if (isEditing && itemId) {
      updateItemMutation.mutate({ id: itemId, data });
    } else {
      createItemMutation.mutate(data);
    }
  };
  
  const isPending = createItemMutation.isPending || updateItemMutation.isPending;
  const isLoading = providersQuery.isLoading || (isEditing && itemQuery.isLoading);
  
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update inventory item details." 
              : "Add a new inventory item to the system."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providersQuery.data?.map(provider => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="externalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Item ID in provider system" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="externalNdc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NDC</FormLabel>
                    <FormControl>
                      <Input placeholder="National Drug Code (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1"
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., tablet, bottle, box" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wholesalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wholesale Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Storage location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1"
                        placeholder="Quantity threshold" 
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Order when quantity drops below this level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reorderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1"
                        placeholder="Quantity to order" 
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How many to order when reordering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="supplierInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Information</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional supplier details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      In Stock
                    </FormLabel>
                    <FormDescription>
                      Mark whether this item is currently in stock
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Item" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Mappings Tab Component
function MappingsTab({ 
  openDialog, 
  editMapping,
  medicationId,
  setMedicationId
}: { 
  openDialog: () => void, 
  editMapping: (id: number) => void,
  medicationId: number | null,
  setMedicationId: (id: number | null) => void
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const medicationsQuery = useQuery({
    queryKey: ["/api/medications"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/medications');
      return await res.json() as Medication[];
    }
  });
  
  const mappingsQuery = useQuery({
    queryKey: ["/api/inventory/mappings", medicationId],
    queryFn: async () => {
      const url = medicationId
        ? `/api/inventory/mappings?medicationId=${medicationId}`
        : '/api/inventory/mappings';
      const res = await apiRequest('GET', url);
      return await res.json() as InventoryMapping[];
    }
  });
  
  const deleteMappingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/inventory/mappings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/mappings"] });
      toast({
        title: "Mapping deleted",
        description: "The inventory mapping has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting mapping",
        description: error.message || "There was an error deleting the mapping."
      });
    }
  });
  
  const togglePrimaryMutation = useMutation({
    mutationFn: async ({ id, isPrimary }: { id: number, isPrimary: boolean }) => {
      return await apiRequest('PUT', `/api/inventory/mappings/${id}`, { isPrimary });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/mappings"] });
      toast({
        title: "Mapping updated",
        description: "The primary inventory source has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating mapping",
        description: error.message || "There was an error updating the mapping."
      });
    }
  });
  
  const filteredMappings = mappingsQuery.data
    ? mappingsQuery.data.filter(mapping => {
        const medName = mapping.medication?.name?.toLowerCase() || "";
        const itemName = mapping.inventoryItem?.name?.toLowerCase() || "";
        const providerName = mapping.provider?.name?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();
        
        return medName.includes(searchLower) || 
               itemName.includes(searchLower) || 
               providerName.includes(searchLower);
      })
    : [];
  
  if (medicationsQuery.isLoading || mappingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (medicationsQuery.isError || mappingsQuery.isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load inventory mappings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleDeleteMapping = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this inventory mapping?")) {
      deleteMappingMutation.mutate(id);
    }
  };
  
  const handleTogglePrimary = (id: number, currentStatus: boolean) => {
    togglePrimaryMutation.mutate({ id, isPrimary: !currentStatus });
  };
  
  const medicationName = medicationId 
    ? medicationsQuery.data?.find(m => m.id === medicationId)?.name || "Unknown Medication"
    : "All Medications";
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="medication-filter">Medication:</Label>
            <Select 
              value={medicationId?.toString() || "all"} 
              onValueChange={(value) => setMedicationId(value === "all" ? null : Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select medication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                {medicationsQuery.data?.map(med => (
                  <SelectItem key={med.id} value={med.id.toString()}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        
        <Button onClick={openDialog}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <span>Inventory Mappings</span>
          <span className="text-sm ml-2 text-muted-foreground">({medicationName})</span>
        </h2>
      </div>
      
      {filteredMappings.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/50">
          <p className="text-muted-foreground">
            {searchTerm
              ? "No mappings match your search."
              : medicationId
                ? "No inventory mappings found for this medication. Add a mapping to connect it to external inventory sources."
                : "No inventory mappings found. Add your first mapping to connect medications to inventory sources."}
          </p>
        </div>
      ) : (
        <Table>
          <TableCaption>
            Showing {filteredMappings.length} inventory mappings
            {medicationId ? ` for ${medicationName}` : ""}
            {searchTerm ? ` matching "${searchTerm}"` : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Inventory Item</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primary Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.map(mapping => (
              <TableRow key={mapping.id}>
                <TableCell className="font-medium">
                  {mapping.medication?.name || "Unknown Medication"}
                </TableCell>
                <TableCell>
                  {mapping.inventoryItem?.name || "Unknown Item"}
                </TableCell>
                <TableCell>
                  {mapping.provider?.name || "Unknown Provider"}
                </TableCell>
                <TableCell>
                  {mapping.mappingStatus === "active" ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Active
                    </span>
                  ) : mapping.mappingStatus === "error" ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      Error
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Switch 
                      checked={mapping.isPrimary}
                      onCheckedChange={() => handleTogglePrimary(mapping.id, mapping.isPrimary)}
                    />
                    {mapping.isPrimary && (
                      <CheckCircle className="text-green-600 ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => editMapping(mapping.id)}>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                    disabled={deleteMappingMutation.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Mapping Form Dialog
function MappingFormDialog({ 
  isOpen, 
  onOpenChange, 
  mappingId, 
  isEditing,
  initialMedicationId
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void,
  mappingId: number | null,
  isEditing: boolean,
  initialMedicationId: number | null
}) {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  
  const mappingQuery = useQuery({
    queryKey: ["/api/inventory/mappings", mappingId],
    queryFn: async () => {
      if (!mappingId) return null;
      const res = await apiRequest('GET', `/api/inventory/mappings/${mappingId}`);
      return await res.json() as InventoryMapping;
    },
    enabled: !!mappingId && isEditing
  });
  
  const medicationsQuery = useQuery({
    queryKey: ["/api/medications"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/medications');
      return await res.json() as Medication[];
    }
  });
  
  const providersQuery = useQuery({
    queryKey: ["/api/inventory/providers"],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inventory/providers?active=true');
      return await res.json() as InventoryProvider[];
    }
  });
  
  const itemsQuery = useQuery({
    queryKey: ["/api/inventory/items", selectedProviderId],
    queryFn: async () => {
      if (!selectedProviderId) return [];
      const res = await apiRequest('GET', `/api/inventory/items?providerId=${selectedProviderId}`);
      return await res.json() as InventoryItem[];
    },
    enabled: !!selectedProviderId
  });
  
  const form = useForm<z.infer<typeof mappingFormSchema>>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      medicationId: initialMedicationId || 0,
      inventoryItemId: 0,
      isPrimary: false,
      mappingType: "manual",
      mappingStatus: "active",
      mappingConfidence: undefined
    }
  });
  
  // Set form values when editing
  useEffect(() => {
    if (mappingQuery.data && isEditing) {
      const mapping = mappingQuery.data;
      
      // Set the selected provider ID from the mapping data
      if (mapping.inventoryItem && mapping.inventoryItem.providerId) {
        setSelectedProviderId(mapping.inventoryItem.providerId);
      }
      
      form.reset({
        medicationId: mapping.medicationId,
        inventoryItemId: mapping.inventoryItemId,
        isPrimary: mapping.isPrimary,
        mappingType: mapping.mappingType,
        mappingStatus: mapping.mappingStatus,
        mappingConfidence: mapping.mappingConfidence
      });
    } else if (!isEditing) {
      form.reset({
        medicationId: initialMedicationId || 0,
        inventoryItemId: 0,
        isPrimary: false,
        mappingType: "manual",
        mappingStatus: "active",
        mappingConfidence: undefined
      });
      setSelectedProviderId(null);
    }
  }, [mappingQuery.data, isEditing, form, isOpen, initialMedicationId]);
  
  const createMappingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mappingFormSchema>) => {
      const res = await apiRequest('POST', '/api/inventory/mappings', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/mappings"] });
      onOpenChange(false);
      toast({
        title: "Mapping created",
        description: "The inventory mapping has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating mapping",
        description: error.message || "There was an error creating the mapping."
      });
    }
  });
  
  const updateMappingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof mappingFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/inventory/mappings/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/mappings"] });
      onOpenChange(false);
      toast({
        title: "Mapping updated",
        description: "The inventory mapping has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating mapping",
        description: error.message || "There was an error updating the mapping."
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof mappingFormSchema>) => {
    if (isEditing && mappingId) {
      updateMappingMutation.mutate({ id: mappingId, data });
    } else {
      createMappingMutation.mutate(data);
    }
  };
  
  const isPending = createMappingMutation.isPending || updateMappingMutation.isPending;
  const isLoading = medicationsQuery.isLoading || providersQuery.isLoading || 
    (isEditing && mappingQuery.isLoading) || 
    (selectedProviderId && itemsQuery.isLoading);
  
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Inventory Mapping" : "Add New Inventory Mapping"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the mapping between medication and inventory item." 
              : "Connect a medication to an external inventory item."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="medicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                    disabled={isEditing || !!initialMedicationId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {medicationsQuery.data?.map(medication => (
                        <SelectItem key={medication.id} value={medication.id.toString()}>
                          {medication.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select 
                  onValueChange={(value) => setSelectedProviderId(Number(value))}
                  value={selectedProviderId?.toString() || ""}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providersQuery.data?.map(provider => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedProviderId && !isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a provider to see available inventory items
                  </p>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="inventoryItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Item</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                      disabled={isEditing || !selectedProviderId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inventory item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemsQuery.data?.map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} ({item.externalId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mappingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mapping Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mapping type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mappingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="mappingConfidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mapping Confidence</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      placeholder="0.0 - 1.0 (optional)" 
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    For automatic mappings, a number between 0 and 1 indicating confidence level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Primary Source
                    </FormLabel>
                    <FormDescription>
                      Set this inventory source as the primary source for this medication
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Mapping" : "Add Mapping"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}