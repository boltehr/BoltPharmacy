import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Redirect, Link } from 'wouter';

type InsuranceProvider = {
  id: number;
  name: string;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  formularyUrl: string | null;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

// Form validation schema
const insuranceProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  description: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Please provide a valid email").optional().nullable(),
  website: z.string().url("Please provide a valid URL").optional().nullable(),
  formularyUrl: z.string().url("Please provide a valid URL").optional().nullable(),
  isActive: z.boolean().default(true),
  logoUrl: z.string().url("Please provide a valid URL").optional().nullable(),
});

export default function InsuranceProviderAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);

  // Create form
  const createForm = useForm({
    resolver: zodResolver(insuranceProviderSchema),
    defaultValues: {
      name: '',
      description: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      formularyUrl: '',
      isActive: true,
      logoUrl: '',
    }
  });

  // Edit form
  const editForm = useForm({
    resolver: zodResolver(insuranceProviderSchema),
    defaultValues: {
      name: '',
      description: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      formularyUrl: '',
      isActive: true,
      logoUrl: '',
    }
  });

  // Set edit form values when a provider is selected
  useEffect(() => {
    if (selectedProvider && isEditDialogOpen) {
      editForm.reset({
        name: selectedProvider.name,
        description: selectedProvider.description || '',
        contactPhone: selectedProvider.contactPhone || '',
        contactEmail: selectedProvider.contactEmail || '',
        website: selectedProvider.website || '',
        formularyUrl: selectedProvider.formularyUrl || '',
        isActive: selectedProvider.isActive,
        logoUrl: selectedProvider.logoUrl || '',
      });
    }
  }, [selectedProvider, isEditDialogOpen, editForm]);

  // Fetch insurance providers
  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['/api/insurance-providers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/insurance-providers');
      return response.json();
    }
  });

  // Create insurance provider mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insuranceProviderSchema>) => {
      const response = await apiRequest('POST', '/api/insurance-providers', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create insurance provider');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-providers'] });
      toast({
        title: 'Insurance provider created',
        description: 'The insurance provider has been created successfully.',
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update insurance provider mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof insuranceProviderSchema> }) => {
      const response = await apiRequest('PATCH', `/api/insurance-providers/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update insurance provider');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-providers'] });
      toast({
        title: 'Insurance provider updated',
        description: 'The insurance provider has been updated successfully.',
      });
      setIsEditDialogOpen(false);
      setSelectedProvider(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete insurance provider mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/insurance-providers/${id}`);
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete insurance provider');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance-providers'] });
      toast({
        title: 'Insurance provider deleted',
        description: 'The insurance provider has been deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedProvider(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle form submissions
  const onCreateSubmit = (data: z.infer<typeof insuranceProviderSchema>) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof insuranceProviderSchema>) => {
    if (selectedProvider) {
      updateMutation.mutate({ id: selectedProvider.id, data });
    }
  };

  const onDeleteConfirm = () => {
    if (selectedProvider) {
      deleteMutation.mutate(selectedProvider.id);
    }
  };

  // Check if user is loading or not admin
  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to access this page. This area is restricted to administrators only.</p>
        <Button asChild className="mt-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Failed to load insurance providers: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/insurance-providers'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Insurance Providers</h1>
          <p className="text-muted-foreground">Manage insurance providers in the system</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {providers && providers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider: InsuranceProvider) => (
            <Card key={provider.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{provider.name}</CardTitle>
                    {provider.isActive ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setSelectedProvider(provider);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {provider.description && (
                  <p className="text-sm text-muted-foreground mb-2">{provider.description}</p>
                )}
                <div className="text-sm space-y-1">
                  {provider.contactEmail && (
                    <p><span className="font-medium">Email:</span> {provider.contactEmail}</p>
                  )}
                  {provider.contactPhone && (
                    <p><span className="font-medium">Phone:</span> {provider.contactPhone}</p>
                  )}
                  {provider.website && (
                    <p><span className="font-medium">Website:</span> <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{provider.website}</a></p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No insurance providers found. Click "Add Provider" to create one.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Insurance Provider Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Insurance Provider</DialogTitle>
            <DialogDescription>
              Create a new insurance provider. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter provider name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Enter a brief description of the provider" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="contact@example.com" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="(123) 456-7890" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="https://example.com" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="formularyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formulary URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="https://example.com/formulary" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        placeholder="https://example.com/logo.png" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Set whether this provider is active in the system
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
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Provider
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Insurance Provider Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Insurance Provider</DialogTitle>
            <DialogDescription>
              Update the insurance provider details. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter provider name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Enter a brief description of the provider" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="contact@example.com" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="(123) 456-7890" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="https://example.com" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="formularyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formulary URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="https://example.com/formulary" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        placeholder="https://example.com/logo.png" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Set whether this provider is active in the system
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
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Provider
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the insurance provider "{selectedProvider?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}