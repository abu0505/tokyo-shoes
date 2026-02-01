import { useState, useRef, useEffect, MouseEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductImageZoomV2Props {
    src: string;
    alt: string;
    className?: string;
}

const ProductImageZoomV2 = ({ src, alt, className = '' }: ProductImageZoomV2Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const isMobile = useIsMobile();

    const [isHovering, setIsHovering] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
    const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });

    // Lens and result box configuration
    const LENS_SIZE = 120; // Circular lens diameter
    const RESULT_WIDTH = 350;
    const RESULT_HEIGHT = 350;
    const ZOOM_FACTOR = 2.0; // Magnification level (reduced from 2.5)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !imageRef.current || !isImageLoaded || isMobile) return;

        const container = containerRef.current;
        const image = imageRef.current;
        const rect = container.getBoundingClientRect();

        // Get cursor position relative to the container
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Center the lens on the cursor
        let lensX = x - LENS_SIZE / 2;
        let lensY = y - LENS_SIZE / 2;

        // Clamp lens position to stay within image boundaries
        const maxLensX = image.offsetWidth - LENS_SIZE;
        const maxLensY = image.offsetHeight - LENS_SIZE;

        lensX = Math.max(0, Math.min(lensX, maxLensX));
        lensY = Math.max(0, Math.min(lensY, maxLensY));

        setLensPosition({ x: lensX, y: lensY });

        // Calculate background position for the result
        // The background needs to show the zoomed portion of the image
        const bgX = (lensX / image.offsetWidth) * (image.offsetWidth * ZOOM_FACTOR);
        const bgY = (lensY / image.offsetHeight) * (image.offsetHeight * ZOOM_FACTOR);

        setBackgroundPosition({ x: bgX, y: bgY });
    };

    const handleMouseEnter = () => {
        if (!isMobile) setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    // Check for cached images on mount
    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            setIsImageLoaded(true);
        }
    }, [src]);

    return (
        <div className={`relative ${className}`}>
            {/* Main Image Container */}
            <div
                id="image-zoom-container"
                ref={containerRef}
                className={`relative rounded-lg overflow-hidden ${isMobile ? '' : 'cursor-crosshair'}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Product Image */}
                <img
                    id="product-image"
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                    loading="eager"
                />

                {/* Zoom Lens - Circular overlay that follows cursor */}
                {isHovering && isImageLoaded && !isMobile && (
                    <div
                        id="zoom-lens"
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: `${LENS_SIZE}px`,
                            height: `${LENS_SIZE}px`,
                            left: `${lensPosition.x}px`,
                            top: `${lensPosition.y}px`,
                            border: '3px solid rgba(255, 255, 255, 0.7)',
                            boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.5)',
                            background: 'transparent',
                        }}
                    />
                )}

                {/* Hover to zoom hint */}
                {!isHovering && isImageLoaded && !isMobile && (
                    <div className="absolute bottom-4 left-4 bg-foreground/90 text-background px-4 py-2 text-xs font-bold pointer-events-none flex items-center gap-2 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        HOVER TO ZOOM
                    </div>
                )}
            </div>

            {/* Zoomed Result Box - Positioned to the right */}
            {isHovering && isImageLoaded && imageRef.current && !isMobile && (
                <div
                    id="zoom-result"
                    className="absolute top-0 border-2 border-foreground shadow-2xl bg-background overflow-hidden z-50"
                    style={{
                        width: `${RESULT_WIDTH}px`,
                        height: `${RESULT_HEIGHT}px`,
                        left: 'calc(100% + 16px)',
                        borderRadius: '8px',
                        backgroundImage: `url(${src})`,
                        backgroundSize: `${imageRef.current.offsetWidth * ZOOM_FACTOR}px ${imageRef.current.offsetHeight * ZOOM_FACTOR}px`,
                        backgroundPosition: `-${backgroundPosition.x}px -${backgroundPosition.y}px`,
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            )}
        </div>
    );
};

export default ProductImageZoomV2;
