import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useAuth } from "../context/auth";
import { useWhiteLabel } from "./whiteLabel";
import { apiRequest } from "../queryClient";
import { useToast } from "../../hooks/use-toast";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  dosage: string;
  quantity: number;
  imageUrl?: string;
  requiresPrescription: boolean;
}

export interface CartContextType {
  isOpen: boolean;
  toggleCart: () => void;
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isGuestCart: boolean;
  cartItemsCount: number;
  guestCartCount: number;
  mergeGuestCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType>({
  isOpen: false,
  toggleCart: () => {},
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isGuestCart: true,
  cartItemsCount: 0,
  guestCartCount: 0,
  mergeGuestCart: async () => {},
});

const GUEST_CART_STORAGE_KEY = 'boltehr-guest-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { config } = useWhiteLabel();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestCartItems, setGuestCartItems] = useState<CartItem[]>([]);
  
  const isGuestCart = !user && config?.allowGuestCart === true;
  const guestCartCount = guestCartItems.reduce((total, item) => total + item.quantity, 0);
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Load guest cart from localStorage on first render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (storedCart) {
        setGuestCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading guest cart from localStorage:', error);
    }
  }, []);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    if (guestCartItems.length > 0) {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestCartItems));
    } else {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  }, [guestCartItems]);

  // Load user cart from the server when user logs in
  useEffect(() => {
    const fetchUserCart = async () => {
      if (user) {
        try {
          const response = await apiRequest('GET', '/api/cart');
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            setCartItems(data.items);
          }
        } catch (error) {
          console.error('Error fetching user cart:', error);
        }
      }
    };

    if (user) {
      fetchUserCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Update user cart on the server when it changes
  useEffect(() => {
    const updateServerCart = async () => {
      if (user && cartItems.length > 0) {
        try {
          await apiRequest('POST', '/api/cart', { items: cartItems });
        } catch (error) {
          console.error('Error updating cart on server:', error);
        }
      }
    };

    if (user) {
      updateServerCart();
    }
  }, [cartItems, user]);

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    if (user) {
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === item.id);
        
        if (existingItem) {
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          return [...prevItems, { ...item, quantity: 1 }];
        }
      });
    } else if (config?.allowGuestCart) {
      setGuestCartItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === item.id);
        
        if (existingItem) {
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          return [...prevItems, { ...item, quantity: 1 }];
        }
      });
      
      toast({
        title: "Item added to guest cart",
        description: "Sign in to save your cart and checkout.",
        variant: "default",
      });
    } else {
      toast({
        title: "Please sign in",
        description: "You need to sign in to add items to your cart.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = (itemId: number) => {
    if (user) {
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      setGuestCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    if (user) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } else {
      setGuestCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        // Clear on server first
        await apiRequest('DELETE', '/api/cart');
        setCartItems([]);
      } catch (error) {
        console.error('Error clearing cart on server:', error);
        toast({
          title: "Error clearing cart",
          description: "There was a problem clearing your cart. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setGuestCartItems([]);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  };

  // Function to merge guest cart into user cart after login
  const mergeGuestCart = async () => {
    if (user && guestCartItems.length > 0) {
      try {
        // Combine guest cart items with existing user cart
        const combinedItems = [...cartItems];
        
        guestCartItems.forEach(guestItem => {
          const existingIndex = combinedItems.findIndex(item => item.id === guestItem.id);
          
          if (existingIndex >= 0) {
            // Increase quantity if item exists
            combinedItems[existingIndex].quantity += guestItem.quantity;
          } else {
            // Add new item if it doesn't exist
            combinedItems.push(guestItem);
          }
        });
        
        // Update state and server
        setCartItems(combinedItems);
        await apiRequest('POST', '/api/cart', { items: combinedItems });
        
        // Clear guest cart
        setGuestCartItems([]);
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        
        toast({
          title: "Guest cart merged",
          description: "Your guest cart items have been added to your account.",
          variant: "default",
        });
      } catch (error) {
        console.error('Error merging guest cart:', error);
        toast({
          title: "Error merging cart",
          description: "There was a problem merging your guest cart. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        isOpen,
        toggleCart,
        cartItems: user ? cartItems : guestCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isGuestCart,
        cartItemsCount,
        guestCartCount,
        mergeGuestCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};