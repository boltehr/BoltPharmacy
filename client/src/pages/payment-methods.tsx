import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CreditCard, Smartphone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Credit card form schema
const creditCardSchema = z.object({
  cardNumber: z.string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^[0-9]+$/, "Card number must contain only digits"),
  cardHolder: z.string().min(1, "Cardholder name is required"),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z.string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be at most 4 digits")
    .regex(/^[0-9]+$/, "CVV must contain only digits"),
});

type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export default function PaymentMethods() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("card");

  // Credit card form
  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const onSubmit = (data: CreditCardFormValues) => {
    // Here you would typically send the data to your payment processor
    console.log("Credit card data:", data);
    toast({
      title: "Payment method saved",
      description: "Your payment method has been saved successfully.",
    });
    
    // Navigate to account page or back to checkout
    setTimeout(() => {
      navigate("/account");
    }, 1500);
  };

  const handleWalletPayment = (type: 'apple' | 'google') => {
    // This would normally integrate with Apple Pay or Google Pay
    toast({
      title: `${type === 'apple' ? 'Apple' : 'Google'} Pay Selected`,
      description: `${type === 'apple' ? 'Apple' : 'Google'} Pay integration will be implemented with Stripe.`,
    });
  };

  return (
    <div className="container max-w-4xl py-10">
      <Helmet>
        <title>Payment Methods | BoltEHR Pharmacy</title>
      </Helmet>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
        <p className="text-muted-foreground mt-2">
          Add and manage your payment methods
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Demo Mode</AlertTitle>
        <AlertDescription>
          This is currently a demonstration of payment functionality. No actual payments will be processed until Stripe integration is completed.
          When ready to implement actual payment processing, Stripe API keys will need to be added.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Payment Method</CardTitle>
          <CardDescription>Your payment information is encrypted and secure</CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="card">
              <CreditCard className="h-4 w-4 mr-2" />
              Credit Card
            </TabsTrigger>
            <TabsTrigger value="apple-pay">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6725 10.8075C17.601 10.8684 16.1173 11.6598 16.1173 13.5214C16.1173 15.6902 18.0195 16.3883 18.0647 16.4058C18.0528 16.4541 17.7305 17.5084 16.9313 18.5861C16.2246 19.5447 15.4845 20.4978 14.3366 20.4978C13.2299 20.4978 12.9047 19.8566 11.651 19.8566C10.4539 19.8566 9.96524 20.4978 8.9463 20.4978C7.8396 20.4978 7.0629 19.4949 6.32685 18.5409C5.44007 17.3881 4.69238 15.5529 4.69238 13.8119C4.69238 10.998 6.58639 9.51175 8.44877 9.51175C9.53168 9.51175 10.4552 10.23 11.1471 10.23C11.8026 10.23 12.8391 9.4702 14.0887 9.4702C14.523 9.4702 15.9448 9.5118 17.0125 10.7271C16.9423 10.7731 17.6725 10.8075 17.6725 10.8075ZM14.1423 7.95169C14.6747 7.31624 15.0497 6.44775 15.0497 5.57926C15.0497 5.46471 15.0378 5.34789 15.0141 5.25081C14.2123 5.27459 13.2774 5.83748 12.6638 6.54828C12.1802 7.09813 11.7311 7.96662 11.7311 8.84664C11.7311 8.97272 11.7547 9.09881 11.7665 9.14409C11.8252 9.15561 11.9194 9.16714 12.0136 9.16714C12.7273 9.16714 13.5744 8.63877 14.1423 7.95169Z" />
              </svg>
              Apple Pay
            </TabsTrigger>
            <TabsTrigger value="google-pay">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5455 3.27273C16.5091 3.27273 19.8182 5.48182 21.2182 8.72727H12.5455V14.3636H21.2182C19.8182 17.6091 16.5091 19.8182 12.5455 19.8182C7.52727 19.8182 3.45455 15.7455 3.45455 11.5455C3.45455 7.34545 7.52727 3.27273 12.5455 3.27273Z" />
              </svg>
              Google Pay
            </TabsTrigger>
          </TabsList>
          
          {/* Credit Card Form */}
          <TabsContent value="card">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="1234 5678 9012 3456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cardHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name on Card</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" className="w-full">Save Card</Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Apple Pay */}
          <TabsContent value="apple-pay">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-40 rounded-lg bg-black text-white mb-4">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6725 10.8075C17.601 10.8684 16.1173 11.6598 16.1173 13.5214C16.1173 15.6902 18.0195 16.3883 18.0647 16.4058C18.0528 16.4541 17.7305 17.5084 16.9313 18.5861C16.2246 19.5447 15.4845 20.4978 14.3366 20.4978C13.2299 20.4978 12.9047 19.8566 11.651 19.8566C10.4539 19.8566 9.96524 20.4978 8.9463 20.4978C7.8396 20.4978 7.0629 19.4949 6.32685 18.5409C5.44007 17.3881 4.69238 15.5529 4.69238 13.8119C4.69238 10.998 6.58639 9.51175 8.44877 9.51175C9.53168 9.51175 10.4552 10.23 11.1471 10.23C11.8026 10.23 12.8391 9.4702 14.0887 9.4702C14.523 9.4702 15.9448 9.5118 17.0125 10.7271C16.9423 10.7731 17.6725 10.8075 17.6725 10.8075ZM14.1423 7.95169C14.6747 7.31624 15.0497 6.44775 15.0497 5.57926C15.0497 5.46471 15.0378 5.34789 15.0141 5.25081C14.2123 5.27459 13.2774 5.83748 12.6638 6.54828C12.1802 7.09813 11.7311 7.96662 11.7311 8.84664C11.7311 8.97272 11.7547 9.09881 11.7665 9.14409C11.8252 9.15561 11.9194 9.16714 12.0136 9.16714C12.7273 9.16714 13.5744 8.63877 14.1423 7.95169Z" />
                    </svg>
                    <span className="ml-2 text-lg font-medium">Pay</span>
                  </div>
                  <p className="text-muted-foreground">Use Apple Pay for fast and secure checkout</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => handleWalletPayment('apple')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6725 10.8075C17.601 10.8684 16.1173 11.6598 16.1173 13.5214C16.1173 15.6902 18.0195 16.3883 18.0647 16.4058C18.0528 16.4541 17.7305 17.5084 16.9313 18.5861C16.2246 19.5447 15.4845 20.4978 14.3366 20.4978C13.2299 20.4978 12.9047 19.8566 11.651 19.8566C10.4539 19.8566 9.96524 20.4978 8.9463 20.4978C7.8396 20.4978 7.0629 19.4949 6.32685 18.5409C5.44007 17.3881 4.69238 15.5529 4.69238 13.8119C4.69238 10.998 6.58639 9.51175 8.44877 9.51175C9.53168 9.51175 10.4552 10.23 11.1471 10.23C11.8026 10.23 12.8391 9.4702 14.0887 9.4702C14.523 9.4702 15.9448 9.5118 17.0125 10.7271C16.9423 10.7731 17.6725 10.8075 17.6725 10.8075ZM14.1423 7.95169C14.6747 7.31624 15.0497 6.44775 15.0497 5.57926C15.0497 5.46471 15.0378 5.34789 15.0141 5.25081C14.2123 5.27459 13.2774 5.83748 12.6638 6.54828C12.1802 7.09813 11.7311 7.96662 11.7311 8.84664C11.7311 8.97272 11.7547 9.09881 11.7665 9.14409C11.8252 9.15561 11.9194 9.16714 12.0136 9.16714C12.7273 9.16714 13.5744 8.63877 14.1423 7.95169Z" />
                </svg>
                Pay with Apple Pay
              </Button>
            </CardContent>
          </TabsContent>
          
          {/* Google Pay */}
          <TabsContent value="google-pay">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-20 w-40 rounded-lg bg-white border border-gray-200 mb-4">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#4285F4">
                      <path d="M12.5455 3.27273C16.5091 3.27273 19.8182 5.48182 21.2182 8.72727H12.5455V14.3636H21.2182C19.8182 17.6091 16.5091 19.8182 12.5455 19.8182C7.52727 19.8182 3.45455 15.7455 3.45455 11.5455C3.45455 7.34545 7.52727 3.27273 12.5455 3.27273Z" />
                    </svg>
                    <span className="ml-2 text-lg font-medium text-gray-800">Pay</span>
                  </div>
                  <p className="text-muted-foreground">Use Google Pay for fast and secure checkout</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleWalletPayment('google')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#4285F4">
                  <path d="M12.5455 3.27273C16.5091 3.27273 19.8182 5.48182 21.2182 8.72727H12.5455V14.3636H21.2182C19.8182 17.6091 16.5091 19.8182 12.5455 19.8182C7.52727 19.8182 3.45455 15.7455 3.45455 11.5455C3.45455 7.34545 7.52727 3.27273 12.5455 3.27273Z" />
                </svg>
                Pay with Google Pay
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="border-t p-6">
          <p className="text-xs text-muted-foreground">
            Your payment information is processed securely. We do not store your full credit card details on our servers.
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Saved Payment Methods</h2>
        <Card className="bg-muted">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-4">
              You don't have any saved payment methods yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}