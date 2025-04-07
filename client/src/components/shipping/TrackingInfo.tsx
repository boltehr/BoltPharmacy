import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { shippingService, type TrackingInfo as TrackingInfoType } from "@/lib/services/shipping";
import { Loader2, Package, Truck, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

interface TrackingInfoProps {
  initialTrackingNumber?: string;
  initialCarrierId?: string;
  userId?: number;
}

const CARRIERS = [
  { id: "ups", name: "UPS" },
  { id: "fedex", name: "FedEx" }
];

export function TrackingInfo({ 
  initialTrackingNumber = "", 
  initialCarrierId = "ups",
  userId
}: TrackingInfoProps) {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [carrierId, setCarrierId] = useState(initialCarrierId);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfoType | null>(null);
  
  // Get tracking info
  const trackingMutation = useMutation({
    mutationFn: async () => {
      if (!trackingNumber || !carrierId) {
        throw new Error("Tracking number and carrier are required");
      }
      return await shippingService.trackPackage(trackingNumber, carrierId, userId);
    },
    onSuccess: (data) => {
      setTrackingInfo(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to track package",
        variant: "destructive",
      });
    },
  });
  
  // Format date strings for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const handleTrack = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    trackingMutation.mutate();
  };
  
  // Auto-track when component loads with initial tracking number
  useEffect(() => {
    if (initialTrackingNumber && initialCarrierId) {
      trackingMutation.mutate();
    }
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Track Your Package</CardTitle>
        <CardDescription>Enter your tracking number to check the status of your shipment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tracking-number">Tracking Number</Label>
            <Input
              id="tracking-number"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="carrier">Carrier</Label>
            <Select value={carrierId} onValueChange={setCarrierId}>
              <SelectTrigger id="carrier">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map(carrier => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleTrack} 
          className="w-full mt-4"
          disabled={trackingMutation.isPending}
        >
          {trackingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Tracking...
            </>
          ) : (
            "Track Package"
          )}
        </Button>

        {trackingInfo && (
          <div className="mt-8 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">
              Tracking #{trackingInfo.trackingNumber}
            </h3>
            <div className="flex items-center mb-4">
              <span className="font-medium mr-2">Status:</span>
              <span className={`font-bold ${
                trackingInfo.status === "Delivered" 
                  ? "text-green-600" 
                  : trackingInfo.status === "In Transit" 
                    ? "text-blue-600" 
                    : "text-amber-600"
              }`}>
                {trackingInfo.status}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-medium">Estimated Delivery:</span>
              <span className="ml-2">{formatDate(trackingInfo.estimatedDelivery)}</span>
            </div>
            
            <h4 className="font-semibold mb-2">Tracking History</h4>
            <div className="space-y-4">
              {trackingInfo.events.map((event, index) => (
                <div key={index} className="flex">
                  <div className="mr-3 mt-1">
                    {event.description.includes("Delivered") ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : event.description.includes("Transit") ? (
                      <Truck className="h-5 w-5 text-blue-600" />
                    ) : event.description.includes("Pickup") ? (
                      <Package className="h-5 w-5 text-amber-600" />
                    ) : (
                      <MapPin className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{event.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(event.timestamp)}</p>
                    <p className="text-sm">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}