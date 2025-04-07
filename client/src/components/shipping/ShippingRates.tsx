import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { shippingService, type ShippingRate } from "@/lib/services/shipping";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ShippingRatesProps {
  destination: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  onSelectRate: (rate: ShippingRate) => void;
  packageDetails?: {
    weight: number;
    length: number;
    width: number;
    height: number;
    value?: number;
  };
}

export function ShippingRates({ 
  destination, 
  onSelectRate, 
  packageDetails 
}: ShippingRatesProps) {
  const { toast } = useToast();
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);

  // Get shipping rates
  const shippingRatesMutation = useMutation({
    mutationFn: async () => {
      return await shippingService.getShippingRates(destination, packageDetails);
    },
    onSuccess: (data) => {
      setRates(data);
      // Auto-select the first option if available
      if (data.length > 0) {
        setSelectedRate(`${data[0].carrierId}-${data[0].serviceCode}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch shipping rates",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (!selectedRate) {
      toast({
        title: "Error",
        description: "Please select a shipping option",
        variant: "destructive",
      });
      return;
    }

    const [carrierId, serviceCode] = selectedRate.split('-');
    const rate = rates.find(r => r.carrierId === carrierId && r.serviceCode === serviceCode);
    
    if (rate) {
      onSelectRate(rate);
    } else {
      toast({
        title: "Error",
        description: "Invalid shipping option selected",
        variant: "destructive",
      });
    }
  };

  // Load rates when component mounts
  useEffect(() => {
    if (destination.street1 && destination.city && destination.state && destination.zip) {
      shippingRatesMutation.mutate();
    }
  }, [destination]);

  if (shippingRatesMutation.isPending) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading shipping options...</span>
      </div>
    );
  }

  if (rates.length === 0 && !shippingRatesMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>No shipping options available for this address</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please verify your shipping address is correct and try again.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => shippingRatesMutation.mutate()}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Options</CardTitle>
        <CardDescription>Select your preferred shipping method</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedRate || ""} 
          onValueChange={setSelectedRate}
          className="space-y-4"
        >
          {rates.map((rate) => (
            <div key={`${rate.carrierId}-${rate.serviceCode}`} className="flex items-center space-x-2 border p-4 rounded-md relative">
              <RadioGroupItem 
                value={`${rate.carrierId}-${rate.serviceCode}`} 
                id={`${rate.carrierId}-${rate.serviceCode}`} 
              />
              <Label 
                htmlFor={`${rate.carrierId}-${rate.serviceCode}`}
                className="flex-1 flex justify-between cursor-pointer"
              >
                <div>
                  <p className="font-medium">{rate.carrierName} - {rate.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: {rate.estimatedDays} {rate.estimatedDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="font-bold">${rate.price.toFixed(2)}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={!selectedRate}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}