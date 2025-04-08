import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { X, ShoppingBag, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/context/cart";

const ShoppingCart = () => {
  const { t } = useTranslation();
  const { isOpen, toggleCart, cartItems, removeFromCart, updateQuantity } = useCart();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div
        className="absolute inset-0 z-0"
        onClick={toggleCart}
        aria-hidden="true"
      />

      <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-background shadow-xl flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t("cart.title")}</h2>
          <Button variant="ghost" size="sm" onClick={toggleCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("cart.empty")}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  toggleCart();
                  window.location.href = "/medications";
                }}
              >
                {t("cart.continueShopping")}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-muted flex items-center justify-center rounded overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-primary/20">Rx</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.dosage}
                    </p>
                    <div className="flex items-center mt-1">
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value))
                        }
                        className="text-xs rounded border border-input p-1 mr-2"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    {item.requiresPrescription && (
                      <div className="text-xs mt-1 text-amber-600">
                        {t("cart.prescriptionRequired")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`${t("cart.remove")} ${item.name}`}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between py-2">
              <span className="text-sm">{t("cart.subtotal")}</span>
              <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <Button
              className="w-full mt-4"
              onClick={() => {
                toggleCart();
                window.location.href = "/checkout";
              }}
            >
              {t("cart.proceedToCheckout")}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                toggleCart();
                window.location.href = "/medications";
              }}
            >
              {t("cart.continueShopping")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;