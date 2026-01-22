import { useState, useRef, MouseEvent } from 'react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ProductImageZoom = ({ src, alt, className = '' }: ProductImageZoomProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Zoom settings
  const ZOOM_FACTOR = 2.5;
  const LENS_SIZE = 120;
  const RESULT_SIZE = 300;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;
    
    // Cursor position relative to container
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Lens half size for centering
    const lensHalf = LENS_SIZE / 2;

    // Clamp lens position within image bounds
    const maxX = img.offsetWidth - LENS_SIZE;
    const maxY = img.offsetHeight - LENS_SIZE;
    
    let lensX = Math.min(Math.max(x - lensHalf, 0), maxX);
    let lensY = Math.min(Math.max(y - lensHalf, 0), maxY);

    setLensPosition({ x: lensX, y: lensY });

    // Calculate background position for zoomed view
    const bgX = (lensX / img.offsetWidth) * 100;
    const bgY = (lensY / img.offsetHeight) * 100;
    setBackgroundPosition(`${bgX}% ${bgY}%`);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />

        {/* Zoom Lens */}
        {isHovering && (
          <div
            className="absolute pointer-events-none border-2 border-white/50 rounded-full bg-white/10 backdrop-blur-[1px]"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lensPosition.x,
              top: lensPosition.y,
              transition: 'left 0.05s ease-out, top 0.05s ease-out',
            }}
          />
        )}

        {/* Hover Hint */}
        {!isHovering && (
          <div className="absolute bottom-4 left-4 bg-foreground/80 text-background px-3 py-2 text-xs font-bold backdrop-blur-sm">
            HOVER TO ZOOM
          </div>
        )}
      </div>

      {/* Zoomed Result Box */}
      {isHovering && (
        <div
          className="absolute top-0 left-[105%] border-2 border-foreground rounded-lg shadow-xl bg-background overflow-hidden z-50 hidden lg:block"
          style={{
            width: RESULT_SIZE,
            height: RESULT_SIZE,
            backgroundImage: `url(${src})`,
            backgroundSize: `${(containerRef.current?.offsetWidth || 0) * ZOOM_FACTOR}px ${(containerRef.current?.offsetHeight || 0) * ZOOM_FACTOR}px`,
            backgroundPosition: backgroundPosition,
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Zoom indicator */}
          <div className="absolute bottom-2 right-2 bg-foreground text-background px-2 py-1 text-xs font-bold">
            {ZOOM_FACTOR}x ZOOM
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageZoom;
