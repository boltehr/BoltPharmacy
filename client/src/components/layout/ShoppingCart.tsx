import { useEffect, useRef } from "react";
import { useCart } from "@/lib/context/cart";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ShoppingCart = () => {
  const { cart, isOpen, closeCart, removeFromCart, updateQuantity } = useCart();
  const overlayRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // Calculate cart totals
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shippingCost = 4.99;
  const total = subtotal + shippingCost;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        overlayRef.current &&
        event.target === overlayRef.current
      ) {
        closeCart();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeCart]);

  // Handle scroll locking when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Check if any items require a prescription
  const requiresPrescription = cart.some(item => item.requiresPrescription);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-50 z-20 overflow-hidden"
      style={{ 
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden" 
      }}
    >
      <div
        ref={cartRef}
        className="fixed right-0 top-0 h-full bg-white w-full max-w-md shadow-xl z-30"
        style={{ 
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out" 
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-neutral-900">
              Your Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
            </h2>
            <Button variant="ghost" size="icon" onClick={closeCart}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">Your cart is empty</h3>
                <p className="text-neutral-600 mt-2">
                  Looks like you haven't added any medications to your cart yet.
                </p>
                <Button
                  className="mt-4"
                  onClick={closeCart}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.medicationId} className="flex py-4 border-b border-neutral-200">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                        <svg className="h-10 w-10 text-neutral-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8V16M8 12H16M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-neutral-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">${item.price.toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.quantity > 1 
                              ? `${item.quantity} x $${item.price.toFixed(2)} each` 
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-neutral-400 hover:text-neutral-600 h-6 w-6"
                              onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-neutral-400 hover:text-neutral-600 h-6 w-6"
                              onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex">
                            <Button
                              variant="ghost"
                              className="font-medium text-primary hover:text-primary-dark p-0 h-auto"
                              onClick={() => removeFromCart(item.medicationId)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prescription status */}
                {requiresPrescription && (
                  <div className="mt-6 bg-neutral-50 p-4 rounded-md">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900">Prescription Required</h4>
                        <p className="text-xs text-neutral-600 mt-1">
                          We'll need your prescription to process this order.
                        </p>
                        <Button
                          variant="link"
                          className="mt-2 p-0 h-auto text-xs font-medium text-primary hover:text-primary-dark flex items-center"
                          asChild
                        >
                          <Link href="/prescriptions">
                            Upload Prescription
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Options */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">Shipping Method</h4>
                  <RadioGroup defaultValue="standard">
                    <div className="space-y-2">
                      <div className="flex items-center p-3 border rounded-md cursor-pointer bg-primary bg-opacity-5 border-primary">
                        <RadioGroupItem value="standard" id="standard" />
                        <div className="ml-3">
                          <Label htmlFor="standard" className="block text-sm font-medium text-neutral-900">Standard Shipping</Label>
                          <span className="block text-xs text-neutral-500">3-5 business days</span>
                        </div>
                        <span className="ml-auto text-sm font-medium text-neutral-900">$4.99</span>
                      </div>
                      <div className="flex items-center p-3 border rounded-md cursor-pointer">
                        <RadioGroupItem value="express" id="express" />
                        <div className="ml-3">
                          <Label htmlFor="express" className="block text-sm font-medium text-neutral-900">Express Shipping</Label>
                          <span className="block text-xs text-neutral-500">1-2 business days</span>
                        </div>
                        <span className="ml-auto text-sm font-medium text-neutral-900">$9.99</span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-neutral-200 p-4 space-y-4">
              <div className="flex justify-between text-base font-medium text-neutral-900">
                <p>Subtotal</p>
                <p>${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <p>Shipping</p>
                <p>${shippingCost.toFixed(2)}</p>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-medium text-neutral-900">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
              <div className="mt-6">
                <Button
                  className="w-full font-bold py-3"
                  size="lg"
                  asChild
                >
                  <Link href="/checkout" onClick={closeCart}>
                    Proceed to Checkout
                  </Link>
                </Button>
              </div>
              <div className="text-center">
                <Button
                  variant="link"
                  className="font-medium text-primary hover:text-primary-dark text-sm"
                  onClick={closeCart}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
