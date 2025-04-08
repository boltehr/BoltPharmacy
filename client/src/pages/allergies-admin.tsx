import React, { useState } from 'react';
import { useAuth } from '@/lib/context/auth';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  ShieldCheck 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  allergies: string[];
  noKnownAllergies: boolean;
  allergiesVerified: boolean;
}

const AllergiesAdmin = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: unverifiedUsers, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ['/api/users/allergies/unverified'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/allergies/unverified');
      if (!response.ok) {
        throw new Error('Failed to fetch unverified allergies');
      }
      return response.json() as Promise<User[]>;
    }
  });
  
  // Verify allergies mutation
  const { mutate: verifyAllergies, isPending: isVerifying } = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/allergies/verify`);
      if (!response.ok) {
        throw new Error('Failed to verify allergies');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['/api/users/allergies/unverified'] });
      toast({
        title: t('allergiesAdmin.verifySuccess'),
        description: t('allergiesAdmin.verifySuccessDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('allergiesAdmin.verifyError'),
        description: error instanceof Error ? error.message : t('allergiesAdmin.verifyErrorDesc'),
        variant: 'destructive',
      });
    }
  });
  
  // Filter users based on search query
  const filteredUsers = unverifiedUsers?.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.firstName && user.firstName.toLowerCase().includes(query)) ||
      (user.lastName && user.lastName.toLowerCase().includes(query)) ||
      user.email.toLowerCase().includes(query)
    );
  });
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Check if the user is an admin
  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  // Handle allergy verification
  const handleVerify = (userId: number) => {
    verifyAllergies(userId);
  };
  
  // Format user name
  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return t('allergiesAdmin.noName');
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('allergiesAdmin.title')}</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('allergiesAdmin.cardTitle')}</CardTitle>
          <CardDescription>{t('allergiesAdmin.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('allergiesAdmin.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('allergiesAdmin.tableName')}</TableHead>
                  <TableHead>{t('allergiesAdmin.tableEmail')}</TableHead>
                  <TableHead>{t('allergiesAdmin.tableAllergies')}</TableHead>
                  <TableHead>{t('allergiesAdmin.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{formatUserName(user)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.noKnownAllergies ? (
                        <Badge variant="outline" className="bg-green-50">
                          {t('allergiesAdmin.noKnownAllergies')}
                        </Badge>
                      ) : user.allergies && user.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.allergies.map((allergy, index) => (
                            <Badge key={index} variant="secondary">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50">
                          {t('allergiesAdmin.noAllergies')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleVerify(user.id)}
                        disabled={isVerifying}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {t('allergiesAdmin.verifyButton')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? (
                <p>{t('allergiesAdmin.noSearchResults')}</p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p>{t('allergiesAdmin.allVerified')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoadingUsers}
          >
            {t('allergiesAdmin.refreshButton')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AllergiesAdmin;