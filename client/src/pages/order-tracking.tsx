import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth";
import { Helmet } from "react-helmet-async";
import { CheckCircle, Truck, Package, Clock, Info, ExternalLink } from "lucide-react";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";

const OrderTracking = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const orderId = params.id;
  
  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: !!orderId,
  });

  // Calculate progress based on status
  const getProgressValue = (status: string) => {
    switch (status) {
      case "pending": return 25;
      case "processing": return 50;
      case "shipped": return 75;
      case "delivered": return 100;
      default: return 0;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };
  
  // Get status steps with dates
  const getStatusSteps = (order: any) => {
    const steps = [
      { name: "Order Placed", status: "pending", date: order?.orderDate },
      { name: "Preparing", status: "processing", date: null },
      { name: "Shipped", status: "shipped", date: null },
      { name: "Delivered", status: "delivered", date: null },
    ];
    
    // Set completed steps based on current status
    let hasSetCurrentStep = false;
    
    return steps.map(step => {
      let completed = false;
      let current = false;
      
      if (order?.status === "cancelled") {
        completed = step.status === "pending";
      } else if (!hasSetCurrentStep) {
        if (getStatusIndex(order?.status) >= getStatusIndex(step.status)) {
          completed = true;
        } else {
          current = true;
          hasSetCurrentStep = true;
        }
      }
      
      return {
        ...step,
        completed,
        current
      };
    });
  };
  
  // Get index for status comparison
  const getStatusIndex = (status: string) => {
    const statuses = ["pending", "processing", "shipped", "delivered"];
    return statuses.indexOf(status || "pending");
  };
  
  // Check if user is authorized to view this order
  const userCanAccessOrder = user && order && user.id === order.userId;
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading order details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mx-auto max-w-md">
            <p className="font-medium">Error loading order</p>
            <p className="text-sm mt-1">The order could not be found or an error occurred.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/orders")}
            >
              Return to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userCanAccessOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg mx-auto max-w-md">
            <p className="font-medium">Access Denied</p>
            <p className="text-sm mt-1">You don't have permission to view this order.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/orders")}
            >
              Return to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const orderProgress = getProgressValue(order.status);
  const statusSteps = getStatusSteps(order);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Order #{order.id} | BoltEHR Pharmacy</title>
        <meta name="description" content={`Track your order #${order.id} from BoltEHR Pharmacy`} />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Track Your Order</h1>
        <p className="text-neutral-600 mt-1">
          Know exactly where your medication is with real-time tracking
        </p>
      </div>
      
      <Card className="overflow-hidden max-w-4xl mx-auto">
        <div className="border-b border-neutral-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-medium text-neutral-900">
                Order #{order.id}
              </h3>
              <p className="text-neutral-600">Placed on {formatDate(order.orderDate)}</p>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              {order.status === "cancelled" ? (
                <div className="flex items-center text-red-500">
                  <Clock className="h-5 w-5 mr-1" />
                  <span className="font-medium capitalize">Cancelled</span>
                </div>
              ) : (
                <div className="flex items-center text-green-500">
                  {order.status === "delivered" ? (
                    <CheckCircle className="h-5 w-5 mr-1" />
                  ) : order.status === "shipped" ? (
                    <Truck className="h-5 w-5 mr-1" />
                  ) : order.status === "processing" ? (
                    <Package className="h-5 w-5 mr-1" />
                  ) : (
                    <Clock className="h-5 w-5 mr-1" />
                  )}
                  <span className="font-medium capitalize">{order.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="relative">
            {/* Progress bar */}
            <Progress value={orderProgress} className="h-2 mb-4" />
            
            {/* Steps */}
            <div className="flex justify-between items-start">
              {statusSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                    step.completed ? "bg-green-500" : 
                    step.current ? "bg-blue-500" : 
                    "bg-neutral-300"
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.current ? (
                      (step.status === "processing" ? <Package className="h-4 w-4" /> : 
                       step.status === "shipped" ? <Truck className="h-4 w-4" /> : 
                       <Clock className="h-4 w-4" />)
                    ) : (
                      (step.status === "processing" ? <Package className="h-4 w-4" /> : 
                       step.status === "shipped" ? <Truck className="h-4 w-4" /> : 
                       step.status === "delivered" ? <CheckCircle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />)
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-neutral-900">{step.name}</p>
                    <p className="text-xs text-neutral-500">
                      {step.completed && step.date 
                        ? formatDate(step.date) 
                        : step.current 
                        ? "In Progress" 
                        : "Upcoming"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h4 className="text-base font-medium text-neutral-900">Shipping Details</h4>
            
            <div className="mt-4 bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Truck className="h-5 w-5 text-neutral-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{order.shippingMethod === "standard" ? "Standard Shipping" : "Express Shipping"}</p>
                  {order.trackingNumber ? (
                    <>
                      <p className="text-sm text-neutral-600">
                        Tracking #: <span className="font-medium">{order.trackingNumber}</span>
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Carrier: {order.carrier || "Not specified"}
                      </p>
                      <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium mt-2 h-auto p-0">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View delivery updates
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-600 mt-1">
                      {order.status === "pending" 
                        ? "Your order is being processed. Tracking information will be available once shipped."
                        : "Tracking information not available"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-neutral-50 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-neutral-500 mr-3 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
              </svg>
              <div>
                <p className="text-sm font-medium text-neutral-900">Delivery Address</p>
                <p className="text-sm text-neutral-600 mt-1">{order.shippingAddress || "Address not specified"}</p>
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <h4 className="text-base font-medium text-neutral-900">Order Items</h4>
              
              <div className="mt-4 space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-start border-b border-neutral-200 pb-4">
                    <div className="h-16 w-16 bg-neutral-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg className="h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M12 8v8m-4-4h8"></path>
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">Medication ID: {item.medicationId}</p>
                          <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-neutral-600">Subtotal</p>
                  <p className="font-medium">${(order.total - order.shippingCost).toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-neutral-600">Shipping</p>
                  <p className="font-medium">${order.shippingCost.toFixed(2)}</p>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <p className="font-semibold">Total</p>
                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Additional information */}
          {order.prescriptionId && (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Prescription Information</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    This order contains medications that require a prescription. Your prescription has been verified.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-neutral-200 p-6">
          <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
            <Button variant="outline" asChild>
              <Link href="/orders">
                View All Orders
              </Link>
            </Button>
            
            {order.status === "pending" && (
              <Button variant="destructive">
                Cancel Order
              </Button>
            )}
            
            {["shipped", "delivered"].includes(order.status) && order.trackingNumber && (
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Track Shipment
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderTracking;
