import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertCircle, TruckIcon, FileText, RefreshCw, SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

type Order = {
  id: number;
  userId: number;
  status: string;
  orderDate: string;
  trackingNumber: string | null;
  carrier: string | null;
  prescriptionId: number | null;
  user?: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  prescription?: {
    id: number;
    verificationStatus: string;
    uploadDate: string;
    verifiedBy: number | null;
    revoked: boolean;
  } | null;
  items?: OrderItem[];
};

type OrderItem = {
  id: number;
  orderId: number;
  medicationId: number;
  quantity: number;
  price: number;
  name: string;
};

export default function OrderAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("by-status");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  // Fetch orders based on selected status
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["/api/orders/status", selectedStatus, page, limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/orders/status/${selectedStatus}?limit=${limit}&offset=${page * limit}`);
      return response.json();
    },
    enabled: !!user && user.role === 'admin' && selectedTab === "by-status"
  });
  
  // Fetch all orders with search
  const { data: allOrdersData, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/orders/all", searchTerm, page, limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/orders/all?search=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${page * limit}`);
      return response.json();
    },
    enabled: !!user && user.role === 'admin' && selectedTab === "all-orders"
  });
  
  // Handle search input submission
  const handleSearch = () => {
    setSearchTerm(searchInputValue);
    setPage(0); // Reset to first page on new search
  };

  // Approve and ship order mutation
  const approveMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/status", selectedStatus] });
      toast({
        title: "Order approved",
        description: "The order has been approved and marked as shipped.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve order. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "verified":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>;
      case "revoked":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Revoked</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Shipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If not admin, show access denied
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
      </div>

      <Tabs defaultValue="by-status" onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="by-status">View by Status</TabsTrigger>
          <TabsTrigger value="all-orders">All Orders (with Search)</TabsTrigger>
        </TabsList>

        <TabsContent value="by-status">
          <Tabs defaultValue="pending" onValueChange={setSelectedStatus}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              <TabsTrigger value="all">All Statuses</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ordersData?.orders?.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Orders</CardTitle>
                <CardDescription>
                  There are no {selectedStatus} orders at this time.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {ordersData?.orders?.map((order: Order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <CardDescription>
                          Placed on {formatDate(order.orderDate)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(order.status)}
                        {order.prescriptionId && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Prescription #{order.prescriptionId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Customer Information</h3>
                        {order.user ? (
                          <div className="space-y-1">
                            <p>{order.user.firstName} {order.user.lastName}</p>
                            <p>{order.user.email}</p>
                            <p>{order.user.phone || "No phone provided"}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">User information not available</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Prescription Status</h3>
                        {order.prescription ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {order.prescription.verificationStatus === "verified" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span>
                                {order.prescription.verificationStatus.charAt(0).toUpperCase() + 
                                 order.prescription.verificationStatus.slice(1)}
                              </span>
                            </div>
                            <p>Uploaded on {formatDate(order.prescription.uploadDate)}</p>
                            {order.prescription.revoked && (
                              <p className="text-red-500">This prescription has been revoked</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            {order.prescriptionId ? 
                              "Prescription information not available" : 
                              "No prescription required for this order"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-semibold mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No items found</p>
                      )}
                    </div>
                    
                    {order.status === "shipped" && order.trackingNumber && (
                      <div className="mt-6 p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4" />
                          <span className="font-medium">Tracking: {order.trackingNumber}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Carrier: {order.carrier?.toUpperCase() || "Unknown"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="bg-muted/30 flex justify-end gap-2">
                    {order.status === "pending" && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            // Navigate to the order details page
                            window.location.href = `/admin/orders/${order.id}`;
                          }}
                        >
                          Edit Order
                        </Button>
                        <Button
                          onClick={() => approveMutation.mutate(order.id)}
                          disabled={
                            approveMutation.isPending || 
                            Boolean(order.prescription && 
                              (order.prescription.verificationStatus !== "verified" || 
                               order.prescription.revoked === true))
                          }
                        >
                          {approveMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              <TruckIcon className="mr-2 h-4 w-4" />
                              Approve & Ship
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    
                    {order.status === "shipped" && (
                      <Button variant="outline" onClick={() => {
                        // View details (could be expanded functionality later)
                        window.location.href = `/admin/orders/${order.id}`;
                      }}>
                        View Details
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {/* Pagination controls */}
              {ordersData && ordersData.total > limit && (
                <div className="flex justify-between items-center pt-4">
                  <Button 
                    variant="outline" 
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page + 1} of {Math.ceil(ordersData.total / limit)}
                  </span>
                  <Button 
                    variant="outline" 
                    disabled={(page + 1) * limit >= ordersData.total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}