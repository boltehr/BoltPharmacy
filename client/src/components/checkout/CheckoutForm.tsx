import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth";
import { useCart } from "@/lib/context/cart";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle, CreditCard, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["creditCard", "paypal"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CheckoutForm = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if any items require a prescription (DEMO MODE: Always false for demo)
  const requiresPrescription = false; // Bypassed for demo purposes

  // Get user's prescriptions
  const { data: prescriptions } = useQuery({
    queryKey: ["/api/prescriptions/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/prescriptions/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const hasValidPrescription = prescriptions?.some(
    (prescription: any) => prescription.status === "approved"
  );

  // Calculate totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shippingCost = { standard: 4.99, express: 9.99 };
  
  // Create order mutation
  const { mutate: createOrder } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: (response) => {
      clearCart();
      toast({
        title: "Order placed successfully",
        description: "Thank you for your order!",
      });
      response.json().then((data) => {
        navigate(`/order/${data.id}`);
      });
    },
  });

  // Initialize form with user data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      shippingMethod: "standard" as const,
      paymentMethod: "creditCard" as const,
      cardNumber: "4242 4242 4242 4242", // Demo card number
      cardExpiry: "12/25",               // Demo expiry
      cardCvc: "123",                    // Demo CVC
    },
  });

  const selectedShipping = form.watch("shippingMethod");
  const selectedPayment = form.watch("paymentMethod");
  const shipping = shippingCost[selectedShipping as keyof typeof shippingCost];
  const total = subtotal + shipping;

  const onSubmit = async (values: FormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before checking out",
        variant: "destructive",
      });
      return;
    }

    // Prescription check bypassed for demo
    // Skip prescription validation for demo purposes

    setIsSubmitting(true);

    try {
      // Get the prescription ID if one is required
      let prescriptionId = null;
      if (requiresPrescription && prescriptions?.length > 0) {
        const approvedPrescription = prescriptions.find(
          (p: any) => p.status === "approved"
        );
        if (approvedPrescription) {
          prescriptionId = approvedPrescription.id;
        }
      }

      // Create order
      const orderData = {
        userId: user?.id,
        shippingMethod: values.shippingMethod,
        shippingCost: shipping,
        total: total,
        shippingAddress: `${values.address}, ${values.city}, ${values.state} ${values.zipCode}`,
        prescriptionId: prescriptionId,
        status: "pending",
      };

      // Create order and order items
      createOrder(orderData);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"].map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${
                            field.value === "standard" ? "bg-primary bg-opacity-5 border-primary" : "border-neutral-200"
                          }`}>
                            <RadioGroupItem value="standard" id="standard" />
                            <div className="ml-3">
                              <Label htmlFor="standard" className="block text-sm font-medium text-neutral-900">Standard Shipping</Label>
                              <span className="block text-xs text-neutral-500">3-5 business days</span>
                            </div>
                            <span className="ml-auto text-sm font-medium text-neutral-900">${shippingCost.standard.toFixed(2)}</span>
                          </div>
                          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${
                            field.value === "express" ? "bg-primary bg-opacity-5 border-primary" : "border-neutral-200"
                          }`}>
                            <RadioGroupItem value="express" id="express" />
                            <div className="ml-3">
                              <Label htmlFor="express" className="block text-sm font-medium text-neutral-900">Express Shipping</Label>
                              <span className="block text-xs text-neutral-500">1-2 business days</span>
                            </div>
                            <span className="ml-auto text-sm font-medium text-neutral-900">${shippingCost.express.toFixed(2)}</span>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {requiresPrescription && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Prescription Information</h3>
                  
                  {hasValidPrescription ? (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertTitle>Prescription Verified</AlertTitle>
                      <AlertDescription>
                        Your prescription has been verified and is ready for use with this order.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Prescription Required</AlertTitle>
                      <AlertDescription>
                        Some items in your cart require a prescription. Please upload it before checking out.
                        <Button variant="outline" className="mt-2 w-full" asChild>
                          <a href="/prescriptions">Upload Prescription</a>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${
                            field.value === "creditCard" ? "bg-primary bg-opacity-5 border-primary" : "border-neutral-200"
                          }`}>
                            <RadioGroupItem value="creditCard" id="creditCard" />
                            <div className="ml-3 flex items-center">
                              <CreditCard className="h-4 w-4 mr-2" />
                              <Label htmlFor="creditCard" className="block text-sm font-medium text-neutral-900">Credit Card</Label>
                            </div>
                          </div>
                          <div className={`flex items-center p-3 border rounded-md cursor-pointer ${
                            field.value === "paypal" ? "bg-primary bg-opacity-5 border-primary" : "border-neutral-200"
                          }`}>
                            <RadioGroupItem value="paypal" id="paypal" />
                            <div className="ml-3 flex items-center">
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.5 21H3L4.5 11H8C9.83333 11 11.1 11.6667 11.5 13C12.5 16 10.5 17 7.5 17H6.5L7 14M17.5 6H14L15.5 16H19C20.8333 16 22.1 15.3333 22.5 14C23.5 11 21.5 10 18.5 10H17.5L18 7" stroke="#0070BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <Label htmlFor="paypal" className="block text-sm font-medium text-neutral-900">PayPal</Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPayment === "creditCard" && (
                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="XXXX XXXX XXXX XXXX" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cardExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="MM/YY" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardCvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
            </Button>
            <p className="text-sm text-center mt-2 text-neutral-600">
              <span className="text-amber-600 font-medium">Demo Mode</span>: Payment processing and prescription validation are bypassed.
            </p>
          </form>
        </Form>
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                <p className="text-neutral-600">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.medicationId} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-neutral-600">Subtotal</p>
                    <p className="font-medium">${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-neutral-600">Shipping</p>
                    <p className="font-medium">${shipping.toFixed(2)}</p>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg">
                    <p className="font-semibold">Total</p>
                    <p className="font-semibold">${total.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutForm;
