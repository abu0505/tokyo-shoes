import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onBrowseClick: () => void;
}

const HeroSection = ({ onBrowseClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] bg-primary text-primary-foreground flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 md:top-20 left-4 md:left-10 text-[8rem] md:text-[20rem] font-black leading-none select-none">
          東
        </div>
        <div className="absolute bottom-10 right-4 md:right-10 text-[6rem] md:text-[15rem] font-black leading-none select-none">
          京
        </div>
      </div>

      <div className="container relative z-10 py-8 md:py-16 px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="max-w-2xl">
            {/* Tagline */}
            <p className="text-accent font-bold text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] mb-4 md:mb-6 animate-fade-in">
              AUTHENTIC STREETWEAR COLLECTION
            </p>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black leading-[0.85] mb-6 md:mb-8 animate-slide-in font-sans">
              TOKYO
              <span className="block text-accent">SHOES</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-xl text-primary-foreground/70 max-w-xl mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Curated selection of premium sneakers. From iconic classics to limited drops.
              Find your next grail.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button
                size="lg"
                onClick={onBrowseClick}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-bold tokyo-shadow-accent hover:translate-x-1 hover:-translate-y-1 transition-all w-full sm:w-auto"
              >
                BROWSE COLLECTION
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-accent bg-foreground text-accent hover:bg-accent hover:text-accent-foreground px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-bold w-full sm:w-auto"
              >
                NEW ARRIVALS
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 md:gap-12 mt-10 md:mt-16 pt-6 md:pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-center md:text-left">
                <p className="text-2xl md:text-4xl font-black text-accent">50+</p>
                <p className="text-xs md:text-sm text-primary-foreground/60 uppercase tracking-wide">Brands</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl md:text-4xl font-black">200+</p>
                <p className="text-xs md:text-sm text-primary-foreground/60 uppercase tracking-wide">Styles</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl md:text-4xl font-black">100%</p>
                <p className="text-xs md:text-sm text-primary-foreground/60 uppercase tracking-wide">Authentic</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="hidden md:block relative animate-fade-in z-20" style={{ animationDelay: '0.2s' }}>
            <img
              src="/hero-img.png"
              alt="Featured Sneaker"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
