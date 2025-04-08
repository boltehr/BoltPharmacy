import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  MenuIcon, 
  X, 
  ShoppingCart, 
  User,
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/lib/context/auth";
import { useCart } from "@/lib/context/cart";
import { useWhiteLabel } from "@/lib/context/whiteLabel";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { toggleCart, cartItems, isGuestCart } = useCart();
  const { config } = useWhiteLabel();
  
  // Use the brand name from white label config
  const brandName = config?.name || "BoltEHR";
  
  // Add brand name to i18n translation context
  useEffect(() => {
    i18n.addResourceBundle('en', 'translation', {
      brandName: brandName
    }, true, true);
    i18n.addResourceBundle('es', 'translation', {
      brandName: brandName
    }, true, true);
  }, [brandName, i18n]);

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  const isAdmin = user?.role === "admin";

  const cartItemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <header className="bg-background border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="text-xl font-bold text-primary">
                  {brandName + " Pharmacy"}
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link href="/">
                <a
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/")
                      ? "border-primary text-primary"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                >
                  {t("common.home")}
                </a>
              </Link>
              <Link href="/medications">
                <a
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/medications")
                      ? "border-primary text-primary"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                >
                  {t("common.medications")}
                </a>
              </Link>
              <Link href="/faq">
                <a
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/faq")
                      ? "border-primary text-primary"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                >
                  {t("common.faq")}
                </a>
              </Link>
              {user && (
                <>
                  <Link href="/prescriptions">
                    <a
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive("/prescriptions")
                          ? "border-primary text-primary"
                          : "border-transparent hover:border-primary/50 hover:text-primary/90"
                      }`}
                    >
                      {t("common.prescriptions")}
                    </a>
                  </Link>
                  <Link href="/orders">
                    <a
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive("/orders")
                          ? "border-primary text-primary"
                          : "border-transparent hover:border-primary/50 hover:text-primary/90"
                      }`}
                    >
                      {t("common.orders")}
                    </a>
                  </Link>

                  <Link href="/my-medications">
                    <a
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive("/my-medications")
                          ? "border-primary text-primary"
                          : "border-transparent hover:border-primary/50 hover:text-primary/90"
                      }`}
                    >
                      {t("common.myMedications")}
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <LanguageSwitcher />
            
            {/* Show cart button for both logged in users and guest users (when allowed) */}
            {(user || isGuestCart) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCart}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            )}
            
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <User className="h-5 w-5" />
                      <span className="max-w-[100px] truncate">{user.email}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("common.account")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <a className="w-full cursor-pointer">
                          {t("common.profile")}
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">
                        <a className="w-full cursor-pointer">
                          {t("common.orders")}
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/prescriptions">
                        <a className="w-full cursor-pointer">
                          {t("common.prescriptions")}
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-medications">
                        <a className="w-full cursor-pointer">
                          {t("common.myMedications")}
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/payment-methods">
                        <a className="w-full cursor-pointer">
                          {t("common.paymentMethods", "Payment Methods")}
                        </a>
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{t("common.admin")}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/medications">
                            <a className="w-full cursor-pointer">
                              {t("admin.medications")}
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users">
                            <a className="w-full cursor-pointer">
                              {t("admin.users")}
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/orders">
                            <a className="w-full cursor-pointer">
                              {t("admin.orders")}
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/prescriptions/verification">
                            <a className="w-full cursor-pointer">
                              {t("admin.prescriptions")}
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/white-label">
                            <a className="w-full cursor-pointer">
                              {t("admin.whiteLabel")}
                            </a>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/admin/inventory">
                            <a className="w-full cursor-pointer">
                              {t("admin.inventory", "Inventory Management")}
                            </a>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer"
                    >
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <a>
                  <Button variant="default" size="sm">
                    {t("common.login")}
                  </Button>
                </a>
              </Link>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            {/* Show cart button for both logged in users and guest users on mobile (when allowed) */}
            {(user || isGuestCart) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCart}
                className="relative mr-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="sr-only">
                {isOpen ? "Close menu" : "Open menu"}
              </span>
              {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/">
            <a
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/")
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent hover:border-primary/50 hover:text-primary/90"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {t("common.home")}
            </a>
          </Link>
          <Link href="/medications">
            <a
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/medications")
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent hover:border-primary/50 hover:text-primary/90"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {t("common.medications")}
            </a>
          </Link>
          <Link href="/faq">
            <a
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/faq")
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent hover:border-primary/50 hover:text-primary/90"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {t("common.faq")}
            </a>
          </Link>
          {user && (
            <>
              <Link href="/prescriptions">
                <a
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/prescriptions")
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.prescriptions")}
                </a>
              </Link>
              <Link href="/orders">
                <a
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/orders")
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.orders")}
                </a>
              </Link>
              <Link href="/account">
                <a
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/account")
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.profile")}
                </a>
              </Link>

              <Link href="/my-medications">
                <a
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/my-medications")
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.myMedications")}
                </a>
              </Link>
              <Link href="/payment-methods">
                <a
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/payment-methods")
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent hover:border-primary/50 hover:text-primary/90"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.paymentMethods", "Payment Methods")}
                </a>
              </Link>
            </>
          )}

          {user && isAdmin && (
            <>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-4 py-2 text-sm font-semibold">
                  {t("common.admin")}
                </div>
                <Link href="/admin/medications">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/medications")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.medications")}
                  </a>
                </Link>
                <Link href="/admin/users">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/users")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.users")}
                  </a>
                </Link>
                <Link href="/admin/orders">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/orders")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.orders")}
                  </a>
                </Link>
                <Link href="/admin/prescriptions/verification">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/prescriptions/verification")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.prescriptions")}
                  </a>
                </Link>
                <Link href="/admin/white-label">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/white-label")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.whiteLabel")}
                  </a>
                </Link>

                <Link href="/admin/inventory">
                  <a
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive("/admin/inventory")
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent hover:border-primary/50 hover:text-primary/90"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("admin.inventory", "Inventory Management")}
                  </a>
                </Link>
              </div>
            </>
          )}

          <div className="flex items-center space-x-4 px-4 py-2">
            <LanguageSwitcher />
            
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                {t("common.logout")}
              </Button>
            ) : (
              <Link href="/auth">
                <a onClick={() => setIsOpen(false)}>
                  <Button variant="default" size="sm">
                    {t("common.login")}
                  </Button>
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;