import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { apiRequest } from "../queryClient";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dob?: string;
  insurance?: {
    provider?: string;
    memberId?: string;
    groupNumber?: string;
    phone?: string;
  };
}

export interface User {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingZipCode?: string | null;
  sameAsShipping?: boolean | null;
  dateOfBirth?: string | null;
  sexAtBirth?: string | null;
  role: string;
  profileCompleted: boolean;
  allergies?: string[];
  noKnownAllergies?: boolean;
  allergiesVerified?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  refetchUser: () => Promise<User | null>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refetchUser: async () => null,
  forgotPassword: async () => {},
  resetPassword: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/user");
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/login", credentials);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err : new Error("Login failed"));
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      const { confirmPassword, ...registrationData } = credentials;
      
      const response = await apiRequest("POST", "/api/register", registrationData);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        
        // Redirect to complete profile page for new users
        window.location.href = "/complete-profile?new=true";
        
        toast({
          title: "Registration successful",
          description: "Please complete your profile to continue",
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err : new Error("Registration failed"));
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiRequest("POST", "/api/logout");
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (err) {
      console.error("Logout error:", err);
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profile: UserProfile) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("PATCH", "/api/user/profile", profile);
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated",
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update profile. Please try again."
        );
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err : new Error("Profile update failed"));
      toast({
        title: "Profile update failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const refetchUser = async (): Promise<User | null> => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/user");
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        return data;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/forgot-password", { email });
      
      if (response.ok) {
        toast({
          title: "Password reset initiated",
          description: "If the email exists in our system, password reset instructions will be sent to it.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to process password reset request."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err : new Error("Password reset failed"));
      toast({
        title: "Password reset failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/reset-password", { 
        token, 
        newPassword 
      });
      
      if (response.ok) {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to reset password."
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err : new Error("Password reset failed"));
      toast({
        title: "Password reset failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        refetchUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};