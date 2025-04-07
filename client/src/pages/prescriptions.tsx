import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { FileText } from "lucide-react";
import PrescriptionUpload from "@/components/prescriptions/PrescriptionUpload";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const Prescriptions = () => {
  const { user } = useAuth();
  
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["/api/prescriptions/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/prescriptions/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });
  
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Prescriptions | BoltEHR Pharmacy</title>
          <meta name="description" content="Upload and manage your prescriptions for ordering medications." />
        </Helmet>
        
        <div className="text-center py-12">
          <LogIn className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Sign In Required</h1>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            You need to be signed in to manage your prescriptions. Please sign in to continue.
          </p>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Prescriptions | BoltEHR Pharmacy</title>
        <meta name="description" content="Upload and manage your prescriptions for ordering medications." />
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Prescriptions</h1>
          <p className="text-neutral-600 mt-1">
            Upload and manage your prescriptions for ordering medications
          </p>
        </div>
      </div>
      
      <Alert className="mb-8">
        <FileText className="h-4 w-4" />
        <AlertTitle>Why upload prescriptions?</AlertTitle>
        <AlertDescription>
          Many medications require a valid prescription from a licensed healthcare provider. 
          Upload your prescription here or request one directly from your doctor to order prescription-only medications.
        </AlertDescription>
      </Alert>
      
      <PrescriptionUpload />
    </div>
  );
};

export default Prescriptions;
