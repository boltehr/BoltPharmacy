import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { 
  ArrowUpDown,
  Box,
  CheckCircle, 
  ClipboardList,
  Clock, 
  Filter, 
  LogIn, 
  Package, 
  Search,
  Truck, 
  X
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";

const OrderHistory = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch user's orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/orders/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });
  
  // Filter and search orders
  const filteredOrders = orders
    ? orders.filter((order: any) => {
        if (filter !== "all" && order.status !== filter) return false;
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            order.id.toString().includes(query) ||
            order.trackingNumber?.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query) ||
            order.carrier?.toLowerCase().includes(query)
          );
        }
        
        return true;
      })
    : [];
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "processing":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-neutral-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };
  
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Order History | BoltEHR Pharmacy</title>
          <meta name="description" content="View and track your medication orders." />
        </Helmet>
        
        <div className="text-center py-12">
          <LogIn className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Sign In Required</h1>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            You need to be signed in to view your order history. Please sign in to continue.
          </p>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Order History | BoltEHR Pharmacy</title>
        <meta name="description" content="View and track your medication orders." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Order History</h1>
        <p className="text-neutral-600 mt-1">
          View and track all your medication orders
        </p>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>My Orders</CardTitle>
          <CardDescription>
            Track the status of your recent orders and view order details
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search by order ID or tracking number"
                className="max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-neutral-500" />
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-neutral-600">Loading your orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Box className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              {searchQuery || filter !== "all" ? (
                <>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">No matching orders</h2>
                  <p className="text-neutral-600 mb-6">
                    We couldn't find any orders matching your current filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">No orders yet</h2>
                  <p className="text-neutral-600 mb-6">
                    You haven't placed any orders yet. Browse our medications to get started.
                  </p>
                  <Button asChild>
                    <Link href="/medications">Shop Medications</Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <div className="flex items-center">
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2 capitalize">{order.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.items?.length || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/order/${order.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {!isLoading && filteredOrders.length > 0 && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-neutral-500">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default OrderHistory;
