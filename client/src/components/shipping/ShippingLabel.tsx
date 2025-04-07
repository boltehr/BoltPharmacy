import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { shippingService, type ShippingLabel as ShippingLabelType, type ShippingAddress, type ShippingRate } from "@/lib/services/shipping";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ShippingLabelProps {
  destination: ShippingAddress;
  shippingRate: ShippingRate;
  packageDetails?: {
    weight: number;
    length: number;
    width: number;
    height: number;
    value?: number;
  };
  onLabelCreated?: (label: ShippingLabelType) => void;
}

export function ShippingLabel({ 
  destination, 
  shippingRate,
  packageDetails,
  onLabelCreated
}: ShippingLabelProps) {
  const { toast } = useToast();
  const [shippingLabel, setShippingLabel] = useState<ShippingLabelType | null>(null);

  // Create shipping label
  const labelMutation = useMutation({
    mutationFn: async () => {
      return await shippingService.createShippingLabel(
        destination, 
        shippingRate.carrierId, 
        shippingRate.serviceCode,
        packageDetails
      );
    },
    onSuccess: (data) => {
      setShippingLabel(data);
      if (onLabelCreated) {
        onLabelCreated(data);
      }
      toast({
        title: "Success",
        description: "Shipping label created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipping label",
        variant: "destructive",
      });
    },
  });

  const handleCreateLabel = () => {
    labelMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Shipping Label</CardTitle>
        <CardDescription>Create and print your shipping label</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Shipping Method</h3>
            <p>{shippingRate.carrierName} - {shippingRate.serviceName}</p>
            <p className="text-sm text-muted-foreground">
              Estimated delivery: {shippingRate.estimatedDays} {shippingRate.estimatedDays === 1 ? 'day' : 'days'}
            </p>
            <p className="font-semibold mt-1">${shippingRate.price.toFixed(2)}</p>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Shipping To</h3>
            <p>{destination.name}</p>
            <p>{destination.street1}</p>
            {destination.street2 && <p>{destination.street2}</p>}
            <p>{destination.city}, {destination.state} {destination.zip}</p>
            <p>{destination.country}</p>
            <p className="mt-1">{destination.phone}</p>
          </div>
          
          {shippingLabel ? (
            <>
              <Alert className="bg-green-50 border-green-200">
                <AlertTitle className="text-green-800">Label Created Successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  Tracking number: {shippingLabel.trackingNumber}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-2">
                <Button asChild>
                  <a href={shippingLabel.labelUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Label
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={shippingLabel.labelUrl} download={`shipping-label-${shippingLabel.trackingNumber}.pdf`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Label
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <Button 
              onClick={handleCreateLabel} 
              className="w-full"
              disabled={labelMutation.isPending}
            >
              {labelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Label...
                </>
              ) : (
                "Create Shipping Label"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}