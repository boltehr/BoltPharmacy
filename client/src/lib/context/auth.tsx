import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types for our auth context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
};

// Type for login data
type LoginData = {
  email: string;
  password: string;
};

// Type for register data (includes all required user fields)
type RegisterData = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  sexAtBirth?: string;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component for auth
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        // Use standard fetch with explicit error handling for more control
        const response = await fetch('/api/user', {
          method: 'GET',
          credentials: 'include', // Important for session cookies
        });
        
        // Handle common response statuses
        if (response.status === 401) {
          // User not authenticated - this is an expected state, not an error
          console.log('User not authenticated');
          return null;
        }
        
        if (!response.ok) {
          // Other error states
          const errorText = await response.text();
          console.error(`API error (${response.status}): ${errorText}`);
          throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }
        
        // Success case
        const userData = await response.json();
        console.log('User authenticated:', userData);
        return userData;
      } catch (error) {
        // Network or parsing errors
        console.error('Error fetching user data:', error);
        // Return null instead of throwing to prevent React Query retry loops
        return null;
      }
    },
    initialData: null,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
    refetchOnWindowFocus: true, // Refresh when tab becomes active
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        return await response.json();
      } catch (error: any) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (userData) => {
      // Set the user data directly in cache to avoid another fetch
      queryClient.setQueryData(['/api/user'], userData);
      
      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Failed to login. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }
        
        return await response.json();
      } catch (error: any) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: (userData) => {
      // Set the user data directly in cache to avoid another fetch
      queryClient.setQueryData(['/api/user'], userData);
      
      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Registration mutation error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Logout failed');
        }
      } catch (error: any) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Immediately update the cache
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Logout mutation error:', error);
      toast({
        title: 'Logout failed',
        description: error.message || 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Login function
  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  // Register function
  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}