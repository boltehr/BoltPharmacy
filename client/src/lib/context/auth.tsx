import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Mock user for demo purposes
const MOCK_USER: User = {
  id: 1,
  username: "user",
  email: "user@example.com",
  password: "", // Password would be hashed in a real app
  firstName: "John",
  lastName: "Doe",
  address: "123 Main St",
  city: "Boston",
  state: "MA",
  zipCode: "02108",
  phone: "555-123-4567",
  dateOfBirth: "1990-01-15",
  sexAtBirth: "Male",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize with mock user for demo purposes
  useEffect(() => {
    // In a real app, we would check for a token in localStorage
    // and validate it with the server
    setUser(MOCK_USER);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // In a real app, we would make an API call to verify credentials
      // and receive a token
      
      // For demo purposes, just check against the mock user
      if (email === MOCK_USER.email) {
        setUser(MOCK_USER);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      // In a real app, we would make an API call to register the user
      
      // For demo purposes, just set the mock user
      setUser({
        ...MOCK_USER,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      return true;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // In a real app, we would clear the token from localStorage
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
