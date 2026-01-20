import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onBrowseClick: () => void;
}

const HeroSection = ({ onBrowseClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[80vh] bg-primary text-primary-foreground flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-[20rem] font-black leading-none select-none">
          東
        </div>
        <div className="absolute bottom-10 right-10 text-[15rem] font-black leading-none select-none">
          京
        </div>
      </div>
      
      <div className="container relative z-10 py-20">
        <div className="max-w-4xl">
          {/* Tagline */}
          <p className="text-accent font-bold text-sm tracking-[0.3em] mb-6 animate-fade-in">
            AUTHENTIC STREETWEAR COLLECTION
          </p>
          
          {/* Main heading */}
          <h1 className="text-7xl md:text-9xl font-black leading-[0.85] mb-8 animate-slide-in">
            TOKYO
            <span className="block text-accent">KICKS</span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Curated selection of premium sneakers. From iconic classics to limited drops.
            Find your next grail.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg"
              onClick={onBrowseClick}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-bold tokyo-shadow-accent hover:translate-x-1 hover:-translate-y-1 transition-all"
            >
              BROWSE COLLECTION
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-6 text-lg font-bold"
            >
              NEW ARRIVALS
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-12 mt-16 pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div>
              <p className="text-4xl font-black text-accent">50+</p>
              <p className="text-sm text-primary-foreground/60 uppercase tracking-wide">Brands</p>
            </div>
            <div>
              <p className="text-4xl font-black">200+</p>
              <p className="text-sm text-primary-foreground/60 uppercase tracking-wide">Styles</p>
            </div>
            <div>
              <p className="text-4xl font-black">100%</p>
              <p className="text-sm text-primary-foreground/60 uppercase tracking-wide">Authentic</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
