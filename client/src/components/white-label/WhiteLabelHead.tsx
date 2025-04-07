import { useWhiteLabel } from "@/lib/context/whiteLabel";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

export default function WhiteLabelHead() {
  const { activeWhiteLabel, isLoading } = useWhiteLabel();
  
  // Apply CSS variables to the root element
  useEffect(() => {
    if (activeWhiteLabel && !isLoading) {
      // Set CSS variables based on the active white label config
      document.documentElement.style.setProperty('--color-primary', activeWhiteLabel.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', activeWhiteLabel.secondaryColor);
      document.documentElement.style.setProperty('--color-accent', activeWhiteLabel.accentColor);
      document.documentElement.style.setProperty('--font-family', activeWhiteLabel.fontFamily);
    } else {
      // Reset to default values if no active white label
      document.documentElement.style.setProperty('--color-primary', '#3b82f6');
      document.documentElement.style.setProperty('--color-secondary', '#10b981');
      document.documentElement.style.setProperty('--color-accent', '#f59e0b');
      document.documentElement.style.setProperty('--font-family', 'Inter');
    }
  }, [activeWhiteLabel, isLoading]);
  
  // If still loading or no active white label, return minimal head
  if (isLoading || !activeWhiteLabel) {
    return (
      <Helmet>
        <title>BoltEHR Pharmacy Platform</title>
      </Helmet>
    );
  }
  
  return (
    <Helmet>
      {/* Set title and meta tags based on white label config */}
      <title>{activeWhiteLabel.companyName} - Pharmacy Platform</title>
      <meta name="description" content={`${activeWhiteLabel.companyName} pharmacy platform for easy and affordable prescription medications.`} />
      
      {/* Set favicon if provided */}
      {activeWhiteLabel.favicon && (
        <link rel="icon" href={activeWhiteLabel.favicon} />
      )}
      
      {/* Load font family if needed */}
      {activeWhiteLabel.fontFamily && activeWhiteLabel.fontFamily !== 'Inter' && (
        <link 
          href={`https://fonts.googleapis.com/css2?family=${activeWhiteLabel.fontFamily.replace(/\s+/g, '+')}&display=swap`} 
          rel="stylesheet"
        />
      )}
      
      {/* Add custom CSS if provided */}
      {activeWhiteLabel.customCss && (
        <style type="text/css">
          {activeWhiteLabel.customCss}
        </style>
      )}
    </Helmet>
  );
}