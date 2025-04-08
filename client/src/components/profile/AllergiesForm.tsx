import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export function AllergiesForm() {
  const { t } = useTranslation();
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [noKnownAllergies, setNoKnownAllergies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user allergies when component mounts
  useEffect(() => {
    if (user) {
      setAllergies(user.allergies || []);
      setNoKnownAllergies(user.noKnownAllergies || false);
    }
  }, [user]);

  const handleAddAllergy = () => {
    const trimmedInput = allergyInput.trim();
    if (trimmedInput && !allergies.includes(trimmedInput)) {
      setAllergies(prev => [...prev, trimmedInput]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleNoAllergiesChange = (checked: boolean) => {
    setNoKnownAllergies(checked);
    if (checked) {
      setAllergies([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAllergy();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Check if at least one option is selected
    if (!noKnownAllergies && allergies.length === 0) {
      toast({
        title: t('allergies.validationError'),
        description: t('allergies.selectOption'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest('PUT', `/api/users/${user.id}/allergies`, {
        allergies,
        noKnownAllergies
      });
      
      // Refetch user data to update context
      await refetchUser();
      
      toast({
        title: t('allergies.saved'),
        description: t('allergies.savedDescription'),
      });
    } catch (error) {
      console.error('Error saving allergies:', error);
      toast({
        title: t('allergies.error'),
        description: t('allergies.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t('allergies.title')}</CardTitle>
        <CardDescription>{t('allergies.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="noKnownAllergies" 
                checked={noKnownAllergies} 
                onCheckedChange={handleNoAllergiesChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="noKnownAllergies">{t('allergies.noKnownAllergies')}</Label>
            </div>
            
            {!noKnownAllergies && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="allergies">{t('allergies.listLabel')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="allergies"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('allergies.placeholder')}
                      disabled={isSubmitting}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddAllergy}
                      disabled={!allergyInput.trim() || isSubmitting}
                    >
                      {t('allergies.add')}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {allergies.map((allergy, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {allergy}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveAllergy(allergy)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">{t('allergies.remove')}</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </>
            )}
            
            {user?.allergiesVerified && (
              <div className="text-sm text-green-600 font-medium">
                {t('allergies.verified')}
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {t('allergies.save')}
        </Button>
      </CardFooter>
    </Card>
  );
}