import { useState, useRef, MouseEvent, WheelEvent } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = ({ src, alt, className = '' }: ImageZoomProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 2.5;
  const ZOOM_STEP = 0.15;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!isHovering) return;
    
    e.preventDefault();
    
    // Scroll down = zoom in, scroll up = zoom out
    const delta = e.deltaY > 0 ? ZOOM_STEP : -ZOOM_STEP;
    
    setZoomLevel(prev => {
      const newZoom = prev + delta;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setZoomLevel(1); // Reset zoom on leave
  };

  const isZoomed = zoomLevel > 1;
  const zoomPercentage = Math.round((zoomLevel - 1) / (MAX_ZOOM - 1) * 100);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${isHovering ? 'cursor-zoom-in' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        style={{ opacity: isZoomed ? 0 : 1 }}
      />
      
      {/* Zoomed overlay */}
      {isHovering && (
        <div
          className="absolute inset-0 pointer-events-none transition-transform duration-100 ease-out"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      
      {/* Zoom indicator */}
      {isHovering && (
        <div className="absolute bottom-4 right-4 bg-foreground text-background px-3 py-2 text-xs font-bold pointer-events-none flex flex-col items-end gap-1">
          <span>{zoomLevel.toFixed(1)}x ZOOM</span>
          {/* Zoom progress bar */}
          <div className="w-20 h-1 bg-background/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-100"
              style={{ width: `${zoomPercentage}%` }}
            />
          </div>
          <span className="text-[10px] opacity-70">SCROLL TO ZOOM</span>
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
