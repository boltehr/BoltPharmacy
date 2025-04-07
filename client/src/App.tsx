import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./lib/context/auth";
import { CartProvider } from "./lib/context/cart";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ShoppingCart from "./components/layout/ShoppingCart";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import Medications from "@/pages/medications";
import MedicationDetail from "@/pages/medication-detail";
import Prescriptions from "@/pages/prescriptions";
import Checkout from "@/pages/checkout";
import Account from "@/pages/account";
import OrderHistory from "@/pages/order-history";
import OrderTracking from "@/pages/order-tracking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/medications" component={Medications} />
      <Route path="/medications/:id" component={MedicationDetail} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/prescriptions">
        <ProtectedRoute>
          <Prescriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/checkout">
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      <Route path="/account">
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute>
          <OrderHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/order/:id">
        <ProtectedRoute>
          <OrderTracking />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
              <ShoppingCart />
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
