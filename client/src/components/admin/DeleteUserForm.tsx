import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const deleteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type DeleteUserFormValues = z.infer<typeof deleteUserSchema>;

export function DeleteUserForm() {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState('');

  const form = useForm<DeleteUserFormValues>({
    resolver: zodResolver(deleteUserSchema),
    defaultValues: {
      email: '',
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('DELETE', `/api/users/email/${email}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: `User with email ${emailToDelete} has been successfully deleted.`,
      });
      form.reset();
      setShowConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete user',
        description: error.message,
      });
    },
  });

  function onSubmit(data: DeleteUserFormValues) {
    setEmailToDelete(data.email);
    setShowConfirm(true);
  }

  function confirmDelete() {
    if (emailToDelete) {
      deleteUserMutation.mutate(emailToDelete);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Delete User</h2>
        <p className="text-muted-foreground">
          Permanently delete a user account and all associated data
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This action cannot be undone. It will permanently delete the user account
          and all associated data including orders, prescriptions, and personal information.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="user@example.com" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Enter the email address of the user you want to delete
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            variant="destructive"
            className="flex items-center gap-2"
            disabled={deleteUserMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              for <strong>{emailToDelete}</strong> and all associated data including orders,
              prescriptions, and personal information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}