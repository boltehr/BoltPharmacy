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
import { Loader2, PlusCircle, CheckCircle, XCircle, Edit, Trash, Download, Globe } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
  borderRadius: z.string().optional().default("0.5rem"),
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
  borderRadius: "0.5rem", // Default rounded corners
  allowGuestCart: true,
  isActive: false,
};

export default function WhiteLabelAdmin() {
  const { loading, config, updateConfig } = useWhiteLabel();
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isParsingWebsite, setIsParsingWebsite] = useState(false);
  
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
  
  // Parse theme from website URL
  const parseWebsiteThemeMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsParsingWebsite(true);
      const res = await apiRequest('POST', '/api/white-labels/parse-website', { url });
      return res.json();
    },
    onSuccess: (data) => {
      setIsParsingWebsite(false);
      
      // Update form values with parsed theme
      form.setValue('primaryColor', data.primaryColor);
      form.setValue('secondaryColor', data.secondaryColor);
      form.setValue('accentColor', data.accentColor);
      form.setValue('fontFamily', data.fontFamily);
      form.setValue('borderRadius', data.borderRadius);
      
      // If logo or favicon was found, update those too
      if (data.logoUrl) {
        form.setValue('logo', data.logoUrl);
      }
      if (data.favicon) {
        form.setValue('favicon', data.favicon);
      }
      
      // Show success message
      toast({
        title: 'Website theme imported',
        description: `Theme successfully imported from ${websiteUrl}`,
      });
    },
    onError: (error) => {
      setIsParsingWebsite(false);
      toast({
        title: 'Failed to import website theme',
        description: error.message || 'An error occurred while importing the theme',
        variant: 'destructive',
      });
    },
  });
  
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
      const whiteLabel = {
        name: selectedWhiteLabel.name,
        companyName: selectedWhiteLabel.companyName,
        contactEmail: selectedWhiteLabel.contactEmail,
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
        borderRadius: selectedWhiteLabel.borderRadius ?? '0.5rem',
        allowGuestCart: selectedWhiteLabel.allowGuestCart ?? true,
        isActive: selectedWhiteLabel.isActive ?? false,
      };
      form.reset(whiteLabel);
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
          borderRadius: data.borderRadius || null,
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
        borderRadius: data.borderRadius || null,
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
    
    const formData = {
      name: whiteLabel.name,
      companyName: whiteLabel.companyName,
      contactEmail: whiteLabel.contactEmail,
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
      borderRadius: whiteLabel.borderRadius ?? '0.5rem',
      allowGuestCart: whiteLabel.allowGuestCart ?? true,
      isActive: whiteLabel.isActive ?? false,
    };
    
    form.reset(formData);
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
                    
                    {/* Website Theme Parser */}
                    <div className="md:col-span-2 bg-secondary/30 p-4 rounded-lg border">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-5 w-5 text-primary" />
                          <h4 className="text-md font-medium">Import Theme from Website</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Extract colors, fonts, and other branding elements from an existing website.
                        </p>
                        
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Enter website URL (e.g., dirxhealth.com)"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              if (!websiteUrl) {
                                toast({
                                  title: "URL required",
                                  description: "Please enter a website URL to import a theme",
                                  variant: "destructive",
                                });
                                return;
                              }
                              parseWebsiteThemeMutation.mutate(websiteUrl);
                            }}
                            disabled={isParsingWebsite || !websiteUrl}
                          >
                            {isParsingWebsite ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Parsing...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Import Theme
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <Alert variant="default" className="bg-primary/10 border-primary/30">
                          <AlertTitle className="flex items-center text-sm font-medium">
                            <Download className="mr-2 h-4 w-4" /> About Website Theme Parsing
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            This tool will attempt to extract colors, fonts, logo, and favicon from the provided website.
                            Results may vary depending on how the site is built. Best results come from sites with clear branding
                            elements and standard CSS practices.
                          </AlertDescription>
                        </Alert>
                      </div>
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
                          <div className="flex gap-2 items-center">
                            <div 
                              className="w-10 h-10 rounded-md border shadow-sm cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: field.value }}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = field.value;
                                input.addEventListener('input', (e) => {
                                  field.onChange((e.target as HTMLInputElement).value);
                                });
                                input.click();
                              }}
                            >
                              <span className="text-xs font-mono text-white text-opacity-80 drop-shadow">Primary</span>
                            </div>
                            <FormControl>
                              <Input placeholder="#3b82f6" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            The main color used for buttons, links, and highlights throughout the site (hex code).
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
                          <div className="flex gap-2 items-center">
                            <div 
                              className="w-10 h-10 rounded-md border shadow-sm cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: field.value }}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = field.value;
                                input.addEventListener('input', (e) => {
                                  field.onChange((e.target as HTMLInputElement).value);
                                });
                                input.click();
                              }}
                            >
                              <span className="text-xs font-mono text-white text-opacity-80 drop-shadow">Secondary</span>
                            </div>
                            <FormControl>
                              <Input placeholder="#10b981" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Secondary color used for background sections, cards, and supporting UI elements (hex code).
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
                          <div className="flex gap-2 items-center">
                            <div 
                              className="w-10 h-10 rounded-md border shadow-sm cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: field.value }}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = field.value;
                                input.addEventListener('input', (e) => {
                                  field.onChange((e.target as HTMLInputElement).value);
                                });
                                input.click();
                              }}
                            >
                              <span className="text-xs font-mono text-white text-opacity-80 drop-shadow">Accent</span>
                            </div>
                            <FormControl>
                              <Input placeholder="#f59e0b" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormDescription>
                            Accent color used for special highlights, call-to-action elements, and important notifications (hex code).
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
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value}
                              onChange={field.onChange}
                            >
                              <option value="Inter">Inter (Default)</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Open Sans">Open Sans</option>
                              <option value="Lato">Lato</option>
                              <option value="Poppins">Poppins</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Times New Roman">Times New Roman</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            The primary font for the website - select from popular web fonts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="borderRadius"
                      render={({ field }) => {
                        // Convert string value to number for the slider
                        const value = field.value ? parseInt(field.value.replace('rem', '')) : 0.5;
                        
                        return (
                          <FormItem>
                            <FormLabel>Border Radius</FormLabel>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <FormDescription className="m-0">
                                  {value === 0 ? "Square (No Rounding)" : 
                                   value <= 0.25 ? "Subtle Rounding" :
                                   value <= 0.5 ? "Moderate Rounding" :
                                   value <= 1 ? "Rounded" :
                                   "Very Rounded"}
                                </FormDescription>
                                <span className="text-sm font-medium">{value}rem</span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="range" 
                                  min="0"
                                  max="2"
                                  step="0.125"
                                  value={value}
                                  onChange={(e) => field.onChange(`${e.target.value}rem`)}
                                  className="w-full"
                                />
                              </div>
                              <div className="flex gap-4 justify-between">
                                <div 
                                  className="w-16 h-16 border shadow-sm flex items-center justify-center"
                                  style={{ borderRadius: "0rem" }}
                                  onClick={() => field.onChange("0rem")}
                                >
                                  <span className="text-xs">Square</span>
                                </div>
                                <div 
                                  className="w-16 h-16 border shadow-sm flex items-center justify-center"
                                  style={{ borderRadius: "0.25rem" }}
                                  onClick={() => field.onChange("0.25rem")}
                                >
                                  <span className="text-xs">Subtle</span>
                                </div>
                                <div 
                                  className="w-16 h-16 border shadow-sm flex items-center justify-center"
                                  style={{ borderRadius: "0.5rem" }}
                                  onClick={() => field.onChange("0.5rem")}
                                >
                                  <span className="text-xs">Default</span>
                                </div>
                                <div 
                                  className="w-16 h-16 border shadow-sm flex items-center justify-center"
                                  style={{ borderRadius: "1rem" }}
                                  onClick={() => field.onChange("1rem")}
                                >
                                  <span className="text-xs">Rounded</span>
                                </div>
                                <div 
                                  className="w-16 h-16 border shadow-sm flex items-center justify-center"
                                  style={{ borderRadius: "1.5rem" }}
                                  onClick={() => field.onChange("1.5rem")}
                                >
                                  <span className="text-xs">Very Round</span>
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
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