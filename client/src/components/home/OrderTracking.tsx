import { CheckCircle, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const OrderTracking = () => {
  // Sample data for demonstration
  const order = {
    id: "BRX-7829",
    date: "Jan 15, 2023",
    status: "Out for Delivery",
    progress: 75,
    steps: [
      { name: "Order Placed", date: "Jan 15, 9:30 AM", completed: true },
      { name: "Preparing", date: "Jan 15, 2:45 PM", completed: true },
      { name: "Shipped", date: "Jan 16, 10:15 AM", completed: true },
      { name: "Delivered", date: "Expected Jan 17", completed: false },
    ],
    shipping: {
      method: "UPS Express Shipping",
      tracking: "1Z999AA10123456784",
      estimatedDelivery: "Jan 17, 2023 by end of day",
    },
    address: {
      name: "John Smith",
      street: "123 Main Street, Apt 4B",
      city: "Boston, MA 02108",
    },
  };

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Track Your Order</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
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
                <p className="text-neutral-600">Placed on {order.date}</p>
              </div>
              <div className="mt-2 md:mt-0 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">{order.status}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="relative">
              {/* Progress bar */}
              <Progress value={order.progress} className="h-2 mb-4" />

              {/* Steps */}
              <div className="flex justify-between items-start">
                {order.steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                      step.completed ? "bg-green-500" : "bg-neutral-300"
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-neutral-900">{step.name}</p>
                      <p className="text-xs text-neutral-500">{step.date}</p>
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
                    <p className="text-sm font-medium text-neutral-900">{order.shipping.method}</p>
                    <p className="text-sm text-neutral-600">
                      Tracking #: <span className="font-medium">{order.shipping.tracking}</span>
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      Estimated delivery: {order.shipping.estimatedDelivery}
                    </p>
                    <Button variant="link" className="text-primary hover:text-primary-dark text-sm font-medium mt-2 h-auto p-0">
                      View delivery updates →
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-neutral-50 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-neutral-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Delivery Address</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    {order.address.name}<br />
                    {order.address.street}<br />
                    {order.address.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default OrderTracking;
