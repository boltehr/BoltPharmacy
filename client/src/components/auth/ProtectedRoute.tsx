import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/context/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfileComplete?: boolean;
}

const ProtectedRoute = ({
  children,
  requireProfileComplete = false,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to auth page
        setLocation("/auth");
      } else if (requireProfileComplete && !user.isProfileComplete) {
        // Profile not complete, redirect to complete profile page
        setLocation("/complete-profile");
      }
    }
  }, [user, loading, setLocation, requireProfileComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is authenticated and profile is complete (if required), render the children
  if (user && (user.isProfileComplete || !requireProfileComplete)) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
};

export default ProtectedRoute;