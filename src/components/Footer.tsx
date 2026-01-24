import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-14">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.png" alt="Tokyo Shoes" className="h-16 w-auto brightness-0 invert" />
            </Link>
            <p className="text-primary-foreground/60 max-w-md mb-6">
              Curated selection of authentic sneakers. From iconic classics to limited edition drops.
            </p>
            <p className="text-sm text-primary-foreground/40">
              © 2024 TOKYO. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold tracking-wide mb-4 text-accent">QUICK LINKS</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Best Sellers
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  All Brands
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold tracking-wide mb-4 text-accent">SUPPORT</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
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
