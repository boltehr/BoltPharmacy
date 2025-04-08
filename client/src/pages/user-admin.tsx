import { useState } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { User } from '@shared/schema';

// Extended user interface with non-nullable role
interface UserWithRole extends User {
  role: string;
}
import { useAuth } from '@/lib/context/auth';
// No PageHeading component, we'll use a simple heading instead
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, SearchIcon, CheckIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DeleteUserForm } from '@/components/admin/DeleteUserForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Role Management Dialog Component
interface RoleManagementDialogProps {
  userId: number;
  userName: string;
  currentRole: string;
  onRoleChange: (userId: number, newRole: string) => void;
}

function RoleManagementDialog({ userId, userName, currentRole, onRoleChange }: RoleManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole || 'user');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onRoleChange(userId, selectedRole);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage Role</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Role</DialogTitle>
          <DialogDescription>
            Change the role for user {userName} (ID: {userId})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User (Customer)</SelectItem>
                <SelectItem value="call_center">Call Center</SelectItem>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UserAdmin() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User role has been updated',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update user role: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Fetch all users
  const { data: users, isLoading, error } = useQuery<UserWithRole[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: user?.role === 'admin',
    staleTime: 60 * 1000, // 1 minute
  });

  // Handle errors
  if (error) {
    toast({
      title: 'Error',
      description: (error as Error).message,
      variant: 'destructive',
    });
  }

  // Filter users based on search query
  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchLower))
    );
  });

  // If user is not an admin, display access denied
  if (user?.role !== 'admin') {
    return (
      <div className="container py-10">
        <Helmet>
          <title>Access Denied | BoltEHR Pharmacy</title>
        </Helmet>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Helmet>
        <title>User Account Management | BoltEHR Pharmacy</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Account Management</h1>
        <p className="text-muted-foreground mt-2">View and manage user accounts in the system</p>
      </div>

      <Tabs defaultValue="users" className="mb-6">
        <TabsList>
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="delete">Delete User</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="mb-6 flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>
                {filteredUsers?.length || 0} user accounts in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : <span className="text-muted-foreground italic">Not provided</span>}
                            </TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                                  {user.role}
                                </Badge>
                              ) : user.role === 'pharmacist' ? (
                                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                                  {user.role}
                                </Badge>
                              ) : user.role === 'call_center' ? (
                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                                  {user.role}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {user.role}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.profileCompleted ? (
                                <Badge variant="default" className="bg-green-500">Complete</Badge>
                              ) : (
                                <Badge variant="destructive">Incomplete</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <RoleManagementDialog 
                                  userId={user.id}
                                  userName={user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.username || user.email || ''}
                                  currentRole={user.role || 'user'}
                                  onRoleChange={(userId, newRole) => {
                                    updateRoleMutation.mutate({ userId, role: newRole });
                                  }}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to user detail view in the future
                                    toast({
                                      title: 'Feature Coming Soon',
                                      description: `Detailed view for user ${user.id} is under development.`
                                    });
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            {searchQuery 
                              ? 'No users match your search' 
                              : 'No users found in the system'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delete">
          <Card>
            <CardHeader>
              <CardTitle>Delete User Account</CardTitle>
              <CardDescription>
                Permanently remove a user from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteUserForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}