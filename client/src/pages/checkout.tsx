import { Helmet } from "react-helmet-async";
import { useCart } from "@/lib/context/cart";
import { useAuth } from "@/lib/context/auth";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckoutForm from "@/components/checkout/CheckoutForm";

const Checkout = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Checkout | BoltEHR Pharmacy</title>
          <meta name="description" content="Complete your medication order checkout." />
        </Helmet>
        
        <div className="text-center py-12">
          <LogIn className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Sign In Required</h1>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            You need to be signed in to complete your checkout. Please sign in to continue.
          </p>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }
  
  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Checkout | BoltEHR Pharmacy</title>
          <meta name="description" content="Complete your medication order checkout." />
        </Helmet>
        
        <div className="text-center py-12">
          <svg className="h-16 w-16 text-neutral-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 7.67001V6.70001C7.5 4.45001 9.31 2.24001 11.56 2.03001C14.24 1.77001 16.5 3.88001 16.5 6.51001V7.89001" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22H15C19.02 22 19.74 20.39 19.95 18.43L20.7 12.43C20.97 9.99 20.27 8 16 8H8C3.73 8 3.03 9.99 3.3 12.43L4.05 18.43C4.26 20.39 4.98 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.5 11.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Your Cart is Empty</h1>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            You don't have any items in your cart yet. Add some medications to your cart to proceed with checkout.
          </p>
          <Button asChild>
            <a href="/medications">Browse Medications</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Checkout | BoltEHR Pharmacy</title>
        <meta name="description" content="Complete your medication order checkout." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
        <p className="text-neutral-600 mt-1">
          Complete your order by providing shipping and payment information
        </p>
      </div>
      
      <CheckoutForm />
    </div>
  );
};

export default Checkout;
