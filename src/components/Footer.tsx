import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-10 md:py-14">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2 text-center md:text-left">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="Tokyo Shoes" className="h-12 md:h-16 w-auto brightness-0 invert mx-auto md:mx-0" />
            </Link>
            <p className="text-primary-foreground/60 max-w-md mb-4 md:mb-6 text-sm md:text-base mx-auto md:mx-0">
              Curated selection of authentic sneakers. From iconic classics to limited edition drops.
            </p>
            <p className="text-xs md:text-sm text-primary-foreground/40">
              © 2024 TOKYO. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold tracking-wide mb-3 md:mb-4 text-accent">QUICK LINKS</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Best Sellers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  All Brands
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold tracking-wide mb-3 md:mb-4 text-accent">SUPPORT</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Returns
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
