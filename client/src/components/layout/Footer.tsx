import { Link } from "wouter";
import { Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">BoltEHR Pharmacy</h3>
            <p className="text-neutral-400 text-sm">
              Affordable medications delivered directly to your door.
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="#"
                className="text-neutral-400 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-400 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-400 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/medications" className="text-neutral-400 hover:text-white text-sm">
                  Medications
                </Link>
              </li>
              <li>
                <Link href="/medications?sort=popular" className="text-neutral-400 hover:text-white text-sm">
                  Popular Items
                </Link>
              </li>
              <li>
                <Link href="/medications?sort=new" className="text-neutral-400 hover:text-white text-sm">
                  New Medications
                </Link>
              </li>
              <li>
                <Link href="/medications?discount=true" className="text-neutral-400 hover:text-white text-sm">
                  Discounts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="text-neutral-400 hover:text-white text-sm">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/prescriptions" className="text-neutral-400 hover:text-white text-sm">
                  My Prescriptions
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-neutral-400 hover:text-white text-sm">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/order/tracking" className="text-neutral-400 hover:text-white text-sm">
                  Track Shipment
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Help
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-neutral-400 hover:text-white text-sm">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-white text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-neutral-400 hover:text-white text-sm">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-400 hover:text-white text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-700">
          <p className="text-neutral-400 text-sm text-center">
            &copy; {new Date().getFullYear()} BoltEHR Pharmacy Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
