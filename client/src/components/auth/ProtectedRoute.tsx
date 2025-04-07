import { useAuth } from "@/lib/context/auth";
import { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: ReactNode;
  requireProfileComplete?: boolean;
};

export default function ProtectedRoute({ 
  children, 
  requireProfileComplete = true 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={`/auth?redirect=${encodeURIComponent(location)}`} />;
  }
  
  // If profile completion is required and profile is not complete,
  // redirect to the profile completion page
  if (requireProfileComplete && !user.profileCompleted && location !== '/complete-profile') {
    return <Redirect to={`/complete-profile?redirect=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}