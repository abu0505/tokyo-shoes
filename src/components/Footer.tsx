import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-10 md:py-14" data-testid="main-footer">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 text-left">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="Tokyo Shoes" className="h-12 md:h-16 w-auto brightness-0 invert" />
            </Link>
            <p className="text-primary-foreground/60 max-w-md mb-4 md:mb-6 text-sm md:text-base">
              Curated selection of authentic sneakers. From iconic classics to limited edition drops.
            </p>
            <p className="text-xs md:text-sm text-primary-foreground/40">
              © 2024 TOKYO. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h3 className="text-xs md:text-sm font-bold tracking-wide mb-3 md:mb-4 text-accent">SHOP & DISCOVER</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link to="/" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Shop Now
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/order-history" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="text-left">
            <h3 className="text-xs md:text-sm font-bold tracking-wide mb-3 md:mb-4 text-accent">MY ACCOUNT & LEGAL</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link to="/profile" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
