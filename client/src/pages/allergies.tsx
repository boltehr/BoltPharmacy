import React from 'react';
import { useAuth } from '@/lib/context/auth';
import { useTranslation } from 'react-i18next';
import { AllergiesForm } from '@/components/profile/AllergiesForm';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Redirect } from 'wouter';

export default function AllergiesPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('allergies.pageTitle')}</h1>
      
      {user?.allergiesVerified ? (
        <Alert className="mb-6 bg-green-50">
          <AlertTitle>{t('allergies.verifiedTitle')}</AlertTitle>
          <AlertDescription>{t('allergies.verifiedDescription')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {(user?.allergies && user?.allergies.length > 0) || user?.noKnownAllergies ? (
            <Alert className="mb-6 bg-yellow-50">
              <AlertTitle>{t('allergies.pendingTitle')}</AlertTitle>
              <AlertDescription>{t('allergies.pendingDescription')}</AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 bg-blue-50">
              <AlertTitle>{t('allergies.infoTitle')}</AlertTitle>
              <AlertDescription>{t('allergies.infoDescription')}</AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      <div className="flex justify-center">
        <AllergiesForm />
      </div>
    </div>
  );
}