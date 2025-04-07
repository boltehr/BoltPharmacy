import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../queryClient";
import { type CartItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cart: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (medicationId: number) => Promise<void>;
  updateQuantity: (medicationId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Default user ID for demo purposes
const DEFAULT_USER_ID = 1;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load cart on initial render
  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch(`/api/cart/${DEFAULT_USER_ID}`);
        const data = await response.json();
        if (data && data.items) {
          setCart(data.items);
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
      }
    };

    loadCart();
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const updateServerCart = async (items: CartItem[]) => {
    try {
      await apiRequest("POST", `/api/cart/${DEFAULT_USER_ID}`, { items });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
      console.error("Failed to update cart:", error);
    }
  };

  const addToCart = async (item: CartItem) => {
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.medicationId === item.medicationId
    );

    let newCart: CartItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      newCart = [...cart];
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newCart[existingItemIndex].quantity + item.quantity,
      };
    } else {
      // Add new item
      newCart = [...cart, item];
    }

    setCart(newCart);
    await updateServerCart(newCart);
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = async (medicationId: number) => {
    const newCart = cart.filter((item) => item.medicationId !== medicationId);
    setCart(newCart);
    await updateServerCart(newCart);
  };

  const updateQuantity = async (medicationId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(medicationId);
      return;
    }

    const newCart = cart.map((item) =>
      item.medicationId === medicationId ? { ...item, quantity } : item
    );

    setCart(newCart);
    await updateServerCart(newCart);
  };

  const clearCart = async () => {
    setCart([]);
    await updateServerCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
