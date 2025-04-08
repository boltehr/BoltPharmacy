import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Medication } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import MedicationAutocomplete from './MedicationAutocomplete';

// Form schema
const userMedicationSchema = z.object({
  medicationId: z.coerce.number({
    required_error: 'Medication is required',
  }),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().default(true),
  source: z.string().default('manual'),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  prescriptionId: z.coerce.number().nullable().optional(),
});

type UserMedicationFormValues = z.infer<typeof userMedicationSchema>;

interface UserMedicationFormProps {
  onSubmit: (data: UserMedicationFormValues) => void;
  initialData?: UserMedicationFormValues;
  medications?: Medication[];
  isLoading?: boolean;
  isEditing?: boolean;
}

const UserMedicationForm: React.FC<UserMedicationFormProps> = ({
  onSubmit,
  initialData,
  medications = [],
  isLoading = false,
  isEditing = false,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  // Initialize form with default values or existing data
  const form = useForm<UserMedicationFormValues>({
    resolver: zodResolver(userMedicationSchema),
    defaultValues: initialData || {
      medicationId: 0,
      dosage: '',
      frequency: '',
      instructions: '',
      notes: '',
      active: true,
      source: 'manual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      prescriptionId: null,
    },
  });

  // Set selected medication when editing
  useEffect(() => {
    if (initialData?.medicationId && medications.length > 0) {
      const medication = medications.find(m => m.id === initialData.medicationId);
      if (medication) {
        setSelectedMedication(medication);
      }
    }
  }, [initialData, medications]);

  // Auto-fill dosage when medication is selected (if not already set)
  useEffect(() => {
    if (selectedMedication?.dosage && !form.getValues('dosage')) {
      form.setValue('dosage', selectedMedication.dosage);
    }
  }, [selectedMedication, form]);

  const handleMedicationSelect = (medication: Medication) => {
    setSelectedMedication(medication);
    form.setValue('medicationId', medication.id);
  };

  const handleSubmit = (data: UserMedicationFormValues) => {
    if (!data.medicationId || data.medicationId === 0) {
      toast({
        title: t('Error'),
        description: t('Please select a medication'),
        variant: 'destructive',
      });
      return;
    }
    
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="medicationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Medication')}</FormLabel>
              <FormControl>
                <MedicationAutocomplete
                  medications={medications}
                  onSelect={handleMedicationSelect}
                  defaultSelectedId={field.value}
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Dosage')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('e.g., 10mg twice daily')} 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Frequency')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('e.g., Every 12 hours')} 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Start Date')}</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('End Date')}</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  {t('Optional. Leave blank if ongoing')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Instructions')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('Any special instructions for taking this medication')} 
                  className="min-h-[80px]"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('Any additional notes or observations')} 
                  className="min-h-[80px]"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('Active Medication')}</FormLabel>
                <FormDescription>
                  {t('Is this a medication you are currently taking?')}
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

        {!isEditing && (
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Source')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select source')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">{t('Manual Entry')}</SelectItem>
                    <SelectItem value="prescription">{t('Prescription')}</SelectItem>
                    <SelectItem value="order">{t('Order')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t('Update Medication') : t('Add Medication')}
        </Button>
      </form>
    </Form>
  );
};

export default UserMedicationForm;