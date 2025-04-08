import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth';
import { Plus, List, Grid, Loader2, AlertCircle } from 'lucide-react';
import { Redirect } from 'wouter';
import { apiRequest, queryClient as baseQueryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import UserMedicationCard from '@/components/medications/UserMedicationCard';
import UserMedicationForm from '@/components/medications/UserMedicationForm';
import { Medication } from '@shared/schema';

interface UserMedication {
  id: number;
  medicationId: number;
  startDate: string;
  endDate: string | null;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  notes: string | null;
  active: boolean;
  source: string;
  medication: {
    id: number;
    name: string;
    genericName: string | null;
    brandName: string | null;
    dosage: string | null;
    imageUrl: string | null;
    category: string | null;
  } | null;
}

export default function UserMedicationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<UserMedication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(null);
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Fetch user medications
  const { 
    data: userMedications, 
    isLoading: loadingMedications,
    error: medicationsError
  } = useQuery<UserMedication[]>({
    queryKey: ['/api/user-medications'],
    retry: 1
  });
  
  // Fetch all medications for adding new ones
  const {
    data: medications,
    isLoading: loadingAllMedications,
  } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
    retry: 1
  });
  
  // Filter medications by search term
  const filteredMedications = userMedications ? userMedications.filter(med => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      med.medication?.name.toLowerCase().includes(searchLower) ||
      med.medication?.genericName?.toLowerCase().includes(searchLower) ||
      med.medication?.brandName?.toLowerCase().includes(searchLower) ||
      med.dosage?.toLowerCase().includes(searchLower) ||
      med.frequency?.toLowerCase().includes(searchLower)
    );
  }) : [];
  
  // Sort medications - active first, then by name
  const sortedMedications = [...(filteredMedications || [])].sort((a, b) => {
    // Sort by active status first
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    
    // Then sort by name
    const nameA = a.medication?.name || '';
    const nameB = b.medication?.name || '';
    return nameA.localeCompare(nameB);
  });
  
  // Add medication mutation
  const addMedicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/user-medications', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medication');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Medication added successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-medications'] });
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to add medication'),
        variant: 'destructive',
      });
    },
  });
  
  // Update medication mutation
  const updateMedicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/user-medications/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update medication');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Medication updated successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-medications'] });
      setEditingMedication(null);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to update medication'),
        variant: 'destructive',
      });
    },
  });
  
  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/user-medications/${id}/toggle-active`, { active });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Medication status updated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-medications'] });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to update status'),
        variant: 'destructive',
      });
    },
  });
  
  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/user-medications/${id}`);
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medication');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Medication deleted successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-medications'] });
      setMedicationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to delete medication'),
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const handleAddMedication = (data: any) => {
    addMedicationMutation.mutate(data);
  };
  
  const handleUpdateMedication = (data: any) => {
    if (editingMedication) {
      updateMedicationMutation.mutate({ id: editingMedication.id, data });
    }
  };
  
  // Handle toggling active status
  const handleToggleActive = (id: number, active: boolean) => {
    toggleActiveMutation.mutate({ id, active });
  };
  
  // Handle editing medication
  const handleEdit = (id: number) => {
    const medication = userMedications?.find(med => med.id === id) || null;
    setEditingMedication(medication);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (medicationToDelete !== null) {
      deleteMedicationMutation.mutate(medicationToDelete);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('My Medications')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('Track and manage your medications')}
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Medication')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{t('Add New Medication')}</DialogTitle>
            </DialogHeader>
            <UserMedicationForm 
              onSubmit={handleAddMedication}
              medications={medications || []}
              isLoading={addMedicationMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-72">
          <Input
            placeholder={t('Search medications...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {loadingMedications ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : medicationsError ? (
        <div className="flex justify-center items-center py-12 text-center">
          <div className="flex flex-col items-center space-y-2">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-lg">{t('Error Loading Medications')}</h3>
            <p className="text-muted-foreground max-w-md">
              {t('There was a problem loading your medications. Please try again.')}
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user-medications'] })}
              variant="outline"
            >
              {t('Try Again')}
            </Button>
          </div>
        </div>
      ) : sortedMedications.length === 0 ? (
        <div className="flex justify-center items-center py-12 text-center">
          <div className="flex flex-col items-center space-y-2">
            <h3 className="font-semibold text-lg">
              {searchTerm 
                ? t('No medications match your search') 
                : t('No medications added yet')}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm
                ? t('Try adjusting your search or clear it to see all medications.')
                : t('Click the "Add Medication" button to start tracking your medications.')}
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
              >
                {t('Clear Search')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "flex flex-col space-y-4"
        }>
          {sortedMedications.map(medication => (
            <UserMedicationCard
              key={medication.id}
              {...medication}
              onToggleActive={handleToggleActive}
              onEdit={handleEdit}
              onDelete={id => setMedicationToDelete(id)}
            />
          ))}
        </div>
      )}
      
      {/* Edit Dialog */}
      {editingMedication && (
        <Dialog open={!!editingMedication} onOpenChange={(open) => !open && setEditingMedication(null)}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{t('Edit Medication')}</DialogTitle>
            </DialogHeader>
            <UserMedicationForm 
              onSubmit={handleUpdateMedication}
              initialData={{
                medicationId: editingMedication.medicationId,
                dosage: editingMedication.dosage,
                frequency: editingMedication.frequency,
                instructions: editingMedication.instructions,
                notes: editingMedication.notes,
                active: editingMedication.active,
                source: editingMedication.source,
                startDate: editingMedication.startDate ? new Date(editingMedication.startDate).toISOString().split('T')[0] : undefined,
                endDate: editingMedication.endDate ? new Date(editingMedication.endDate).toISOString().split('T')[0] : null,
                prescriptionId: null
              }}
              medications={medications || []}
              isLoading={updateMedicationMutation.isPending}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={medicationToDelete !== null} onOpenChange={(open) => !open && setMedicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Medication')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Are you sure you want to delete this medication? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMedicationMutation.isPending}
            >
              {deleteMedicationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}