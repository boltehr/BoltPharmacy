import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/context/auth";
import { useWhiteLabel } from "@/lib/context/whiteLabel";
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, FileText, ShoppingCart, CreditCard, HeartPulse, CheckCircle, Loader2 } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo?: string;
  linkText?: string;
  isCompleted: boolean;
}

const OnboardingWizard = () => {
  const { user } = useAuth();
  const { config } = useWhiteLabel();
  const { steps: progressSteps, loading: progressLoading } = useOnboardingProgress();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipped, setSkipped] = useState(false);

  // Brand name for display (with fallback)
  const brandName = config?.name || "BoltEHR Pharmacy";

  // Base step definitions
  const stepDefinitions = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Make sure we have all your basic information to provide personalized medication recommendations.",
      icon: <User className="h-12 w-12 text-primary" />,
      linkTo: "/account",
      linkText: "Update Profile",
    },
    {
      id: "medications",
      title: "Add Your Medications",
      description: "Tell us which medications you're taking so we can help manage refills and check for interactions.",
      icon: <HeartPulse className="h-12 w-12 text-primary" />,
      linkTo: "/user-medications",
      linkText: "Add Medications",
    },
    {
      id: "prescriptions",
      title: "Upload Prescriptions",
      description: "Upload your prescriptions so our pharmacists can verify them for your orders.",
      icon: <FileText className="h-12 w-12 text-primary" />,
      linkTo: "/prescriptions",
      linkText: "Upload Now",
    },
    {
      id: "checkout",
      title: "Place Your First Order",
      description: "Browse medications and add them to your cart to complete your first order.",
      icon: <ShoppingCart className="h-12 w-12 text-primary" />,
      linkTo: "/medications",
      linkText: "Browse Medications",
    },
    {
      id: "payment",
      title: "Save Payment Method",
      description: "Add a payment method to make future checkout processes faster.",
      icon: <CreditCard className="h-12 w-12 text-primary" />,
      linkTo: "/payment-methods",
      linkText: "Add Payment",
    },
  ];
  
  // Merge step definitions with completion status
  const steps: OnboardingStep[] = stepDefinitions.map(step => {
    const progressStep = progressSteps?.find(p => p.id === step.id);
    return {
      ...step,
      isCompleted: progressStep?.isCompleted || false
    };
  });

  // Show wizard only after a short delay
  useEffect(() => {
    // Don't show for admin users or if skipped
    if (user?.role === "admin" || localStorage.getItem("onboardingSkipped") === "true") {
      return;
    }
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Calculate progress
  useEffect(() => {
    if (!isVisible) return;
    
    const completedSteps = steps.filter(step => step.isCompleted).length;
    const newProgress = Math.floor((completedSteps / steps.length) * 100);
    
    const timer = setTimeout(() => {
      setProgress(newProgress);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Close the wizard when completed all steps
      setIsVisible(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setSkipped(true);
    localStorage.setItem("onboardingSkipped", "true");
  };

  const handleGoToStep = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData.linkTo) {
      navigate(currentStepData.linkTo);
      setIsVisible(false);
    }
  };

  if (!isVisible || !user) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Welcome to {brandName}</CardTitle>
            <button onClick={handleSkip} className="text-sm text-neutral-500 hover:text-neutral-700">
              Skip for now
            </button>
          </div>
          <CardDescription>
            Complete these steps to get the most out of your pharmacy experience
          </CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
          <div className="text-xs text-right mt-1 text-neutral-500">
            {Math.round(progress)}% Complete
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center text-center p-4">
            {currentStepData.icon}
            <h3 className="text-xl font-semibold mt-4">{currentStepData.title}</h3>
            <p className="text-neutral-600 mt-2">{currentStepData.description}</p>
            
            {currentStepData.isCompleted && (
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Already completed!</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {!currentStepData.isCompleted && currentStepData.linkTo && (
              <Button onClick={handleGoToStep}>
                {currentStepData.linkText || "Go to Step"}
              </Button>
            )}
            
            <Button 
              variant={currentStepData.isCompleted ? "default" : "secondary"}
              onClick={handleNext}
            >
              {isLastStep ? "Finish" : "Next Step"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingWizard;