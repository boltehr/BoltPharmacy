import { useState, useEffect } from "react";
import { useWhiteLabel } from "@/lib/context/whiteLabel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WhiteLabel } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { Loader2, PlusCircle, CheckCircle, XCircle, Edit, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
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

// Form validation schema for creating/editing white label configs
const whiteLabelFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contactPhone: z.string().optional(),
  logo: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g., #3b82f6).",
  }),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g., #10b981).",
  }),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please enter a valid hex color code (e.g., #f59e0b).",
  }),
  fontFamily: z.string().min(1, {
    message: "Please select a font family.",
  }),
  customCss: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  customFooter: z.string().optional().nullable(),
  customHeader: z.string().optional().nullable(),
  termsUrl: z.string().url().optional().nullable(),
  privacyUrl: z.string().url().optional().nullable(),
  allowGuestCart: z.boolean().default(true),
  isActive: z.boolean().optional(),
});

type WhiteLabelFormValues = z.infer<typeof whiteLabelFormSchema>;

const defaultValues: Partial<WhiteLabelFormValues> = {
  primaryColor: "#3b82f6", // Default blue
  secondaryColor: "#10b981", // Default green
  accentColor: "#f59e0b", // Default amber
  fontFamily: "Inter",
  allowGuestCart: true,
  isActive: false,
};

export default function WhiteLabelAdmin() {
  const { loading, config, updateConfig } = useWhiteLabel();
  const { toast } = useToast();
  
  // Get white label configurations
  const { 
    data: whiteLabels = [] as WhiteLabel[],
    isLoading: isWhiteLabelsLoading
  } = useQuery<WhiteLabel[]>({
    queryKey: ['/api/white-labels'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Current active white label
  const activeWhiteLabel = whiteLabels.find((wl: WhiteLabel) => wl.isActive) || null;
  
  // Current default white label
  const defaultWhiteLabel = whiteLabels.find((wl: WhiteLabel) => wl.isDefault) || null;
  
  // Create a new white label configuration
  const createWhiteLabelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/white-labels', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'White label created',
        description: 'The white label configuration has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update an existing white label configuration
  const updateWhiteLabelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/white-labels/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'White label updated',
        description: 'The white label configuration has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Activate a white label configuration
  const activateWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/white-labels/${id}/activate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'White label activated',
        description: 'The white label configuration has been activated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to activate white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Deactivate a white label configuration
  const deactivateWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/white-labels/${id}/deactivate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'White label deactivated',
        description: 'The white label configuration has been deactivated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to deactivate white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Set a white label configuration as default
  const setDefaultWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/white-labels/${id}/set-default`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'Default white label set',
        description: 'The white label configuration has been set as the default successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to set default white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Unset a white label configuration as default
  const unsetDefaultWhiteLabelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/white-labels/${id}/unset-default`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/white-labels'] });
      toast({
        title: 'Default white label unset',
        description: 'The white label configuration is no longer the default.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to unset default white label',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [selectedWhiteLabel, setSelectedWhiteLabel] = useState<WhiteLabel | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form for creating/editing white label configs
  const form = useForm<WhiteLabelFormValues>({
    resolver: zodResolver(whiteLabelFormSchema),
    defaultValues: defaultValues,
  });

  // Update form when selectedWhiteLabel changes
  useEffect(() => {
    if (selectedWhiteLabel) {
      form.reset({
        ...selectedWhiteLabel,
        // Convert any nulls to empty strings for the form
        logo: selectedWhiteLabel.logo ?? '',
        customCss: selectedWhiteLabel.customCss ?? '',
        favicon: selectedWhiteLabel.favicon ?? '',
        address: selectedWhiteLabel.address ?? '',
        customFooter: selectedWhiteLabel.customFooter ?? '',
        customHeader: selectedWhiteLabel.customHeader ?? '',
        termsUrl: selectedWhiteLabel.termsUrl ?? '',
        privacyUrl: selectedWhiteLabel.privacyUrl ?? '',
        contactPhone: selectedWhiteLabel.contactPhone ?? '',
        primaryColor: selectedWhiteLabel.primaryColor ?? '',
        secondaryColor: selectedWhiteLabel.secondaryColor ?? '',
        accentColor: selectedWhiteLabel.accentColor ?? '',
        fontFamily: selectedWhiteLabel.fontFamily ?? '',
        allowGuestCart: selectedWhiteLabel.allowGuestCart ?? true,
        isActive: selectedWhiteLabel.isActive ?? false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [selectedWhiteLabel, form, defaultValues]);

  // Function to handle form submission
  function onSubmit(data: WhiteLabelFormValues) {
    if (isEditMode && selectedWhiteLabel) {
      // Update existing white label
      updateWhiteLabelMutation.mutate({
        id: selectedWhiteLabel.id,
        data: {
          ...data,
          // Convert empty strings to null for DB storage
          logo: data.logo || null,
          customCss: data.customCss || null,
          favicon: data.favicon || null,
          address: data.address || null,
          customFooter: data.customFooter || null,
          customHeader: data.customHeader || null,
          termsUrl: data.termsUrl || null,
          privacyUrl: data.privacyUrl || null,
          primaryColor: data.primaryColor || null,
          secondaryColor: data.secondaryColor || null,
          accentColor: data.accentColor || null,
          fontFamily: data.fontFamily || null,
        },
      });
    } else {
      // Create new white label
      createWhiteLabelMutation.mutate({
        ...data,
        // Convert empty strings to null for DB storage
        logo: data.logo || null,
        customCss: data.customCss || null,
        favicon: data.favicon || null,
        address: data.address || null,
        customFooter: data.customFooter || null,
        customHeader: data.customHeader || null,
        termsUrl: data.termsUrl || null,
        privacyUrl: data.privacyUrl || null,
        primaryColor: data.primaryColor || null,
        secondaryColor: data.secondaryColor || null,
        accentColor: data.accentColor || null,
        fontFamily: data.fontFamily || null,
      });
    }

    // Reset form and state after submission
    if (isEditMode) {
      setIsEditMode(false);
      setSelectedWhiteLabel(null);
    }
    form.reset(defaultValues);
  }

  // Function to handle edit button click
  function handleEdit(whiteLabel: WhiteLabel) {
    setSelectedWhiteLabel(whiteLabel);
    setIsEditMode(true);
    form.reset({
      ...whiteLabel,
      // Convert any nulls to empty strings for the form
      logo: whiteLabel.logo ?? '',
      customCss: whiteLabel.customCss ?? '',
      favicon: whiteLabel.favicon ?? '',
      address: whiteLabel.address ?? '',
      customFooter: whiteLabel.customFooter ?? '',
      customHeader: whiteLabel.customHeader ?? '',
      termsUrl: whiteLabel.termsUrl ?? '',
      privacyUrl: whiteLabel.privacyUrl ?? '',
      contactPhone: whiteLabel.contactPhone ?? '',
      primaryColor: whiteLabel.primaryColor ?? '',
      secondaryColor: whiteLabel.secondaryColor ?? '',
      accentColor: whiteLabel.accentColor ?? '',
      fontFamily: whiteLabel.fontFamily ?? '',
      allowGuestCart: whiteLabel.allowGuestCart ?? true,
      isActive: whiteLabel.isActive ?? false,
    });
  }

  // Function to handle activate/deactivate button click
  function handleToggleActive(id: number, currentState: boolean) {
    if (currentState) {
      deactivateWhiteLabelMutation.mutate(id);
    } else {
      activateWhiteLabelMutation.mutate(id);
    }
  }
  
  // Function to handle set/unset default button click
  function handleToggleDefault(id: number, currentState: boolean) {
    if (currentState) {
      unsetDefaultWhiteLabelMutation.mutate(id);
    } else {
      setDefaultWhiteLabelMutation.mutate(id);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>White Label Configuration - BoltEHR Pharmacy Platform</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">White Label Administration</h1>
        <p className="text-muted-foreground">
          Configure white label settings for the pharmacy platform.
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">Configurations</TabsTrigger>
          <TabsTrigger value="create">
            {isEditMode ? "Edit Configuration" : "Create New Configuration"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>White Label Configurations</CardTitle>
              <CardDescription>
                Manage white label configurations for the pharmacy platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWhiteLabelsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin h-10 w-10 text-primary" />
                </div>
              ) : whiteLabels.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No white label configurations found.</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedWhiteLabel(null);
                      form.reset(defaultValues);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Configuration
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>List of white label configurations.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whiteLabels.map((whiteLabel: WhiteLabel) => (
                      <TableRow key={whiteLabel.id}>
                        <TableCell className="font-medium">{whiteLabel.name}</TableCell>
                        <TableCell>{whiteLabel.companyName}</TableCell>
                        <TableCell>
                          {whiteLabel.isActive ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <XCircle className="mr-1 h-4 w-4" />
                              Inactive
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {whiteLabel.isDefault ? (
                            <div className="flex items-center text-blue-600">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Default
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <XCircle className="mr-1 h-4 w-4" />
                              Not Default
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {whiteLabel.updatedAt 
                            ? new Date(whiteLabel.updatedAt).toLocaleDateString() 
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(whiteLabel)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={whiteLabel.isActive ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleActive(whiteLabel.id, Boolean(whiteLabel.isActive))}
                              title={whiteLabel.isActive ? "Deactivate" : "Activate"}
                            >
                              {whiteLabel.isActive ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant={whiteLabel.isDefault ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleDefault(whiteLabel.id, Boolean(whiteLabel.isDefault))}
                              title={whiteLabel.isDefault ? "Unset as Default" : "Set as Default"}
                            >
                              {whiteLabel.isDefault ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditMode ? "Edit White Label Configuration" : "Create New White Label Configuration"}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? `Update the settings for ${selectedWhiteLabel?.name}`
                  : "Create a new white label configuration for the platform."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <Separator />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Site, Partner A" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique name to identify this configuration.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BoltEHR Pharmacy" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of the company displayed on the site.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The primary email for customer support.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormDescription>
                            The support phone number (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Branding */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-lg font-semibold mt-6">Branding</h3>
                      <Separator />
                    </div>

                    <FormField
                      control={form.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            A direct URL to the logo image (SVG recommended).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="favicon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favicon URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/favicon.ico" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            A direct URL to the favicon image.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input placeholder="#3b82f6" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            The main color used throughout the site (hex code).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input placeholder="#10b981" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Secondary color used for elements like buttons (hex code).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input placeholder="#f59e0b" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Accent color used for highlights and calls to action (hex code).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <FormControl>
                            <Input placeholder="Inter" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            The primary font for the website.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Feature Settings */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-lg font-semibold mt-6">Feature Settings</h3>
                      <Separator />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="allowGuestCart"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Allow Guest Cart</FormLabel>
                          </div>
                          <FormDescription>
                            Allow users to add items to cart without signing in.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Advanced Settings */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-lg font-semibold mt-6">Advanced Settings</h3>
                      <Separator />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="123 Main St, City, State 12345" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            The physical address of the company (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customHeader"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Custom Header HTML</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="<div>Custom header content</div>" 
                              {...field} 
                              value={field.value || ''}
                              className="font-mono text-sm h-32"
                            />
                          </FormControl>
                          <FormDescription>
                            Custom HTML to include in the site header (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customFooter"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Custom Footer HTML</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="<div>Custom footer content</div>" 
                              {...field} 
                              value={field.value || ''}
                              className="font-mono text-sm h-32"
                            />
                          </FormControl>
                          <FormDescription>
                            Custom HTML to include in the site footer (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customCss"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Custom CSS</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder=".custom-class { color: blue; }" 
                              {...field} 
                              value={field.value || ''}
                              className="font-mono text-sm h-32"
                            />
                          </FormControl>
                          <FormDescription>
                            Custom CSS styles to apply to the site (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="termsUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/terms" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Link to the terms and conditions page (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Privacy Policy URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/privacy" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Link to the privacy policy page (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Activate Configuration</FormLabel>
                            <FormDescription>
                              Make this the active white label configuration for the platform.
                              This will deactivate any currently active configuration.
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
                  </div>

                  <div className="flex justify-end space-x-4">
                    {isEditMode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditMode(false);
                          setSelectedWhiteLabel(null);
                          form.reset(defaultValues);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit"
                      disabled={createWhiteLabelMutation.isPending || updateWhiteLabelMutation.isPending}
                    >
                      {(createWhiteLabelMutation.isPending || updateWhiteLabelMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isEditMode ? "Update Configuration" : "Create Configuration"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}