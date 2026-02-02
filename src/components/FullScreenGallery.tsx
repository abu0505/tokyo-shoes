import { useState, useRef, useEffect, TouchEvent } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';

interface FullScreenGalleryProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

const FullScreenGallery = ({ images, initialIndex, isOpen, onClose }: FullScreenGalleryProps) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        duration: 20
    });

    // Sync internal index with embla to update UI count
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (emblaApi) {
            emblaApi.scrollTo(initialIndex, true);
            emblaApi.on('select', () => {
                setCurrentIndex(emblaApi.selectedScrollSnap());
            });
        }
    }, [emblaApi, initialIndex]);

    // Reset zoom when slide changes
    useEffect(() => {
        if (emblaApi) {
            emblaApi.on('select', () => {
                // We rely on the ZoomableImage component to reset itself via key change or exposed ref
                // but giving it a unique key based on index is easiest
            });
        }
    }, [emblaApi]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black touch-none flex flex-col"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <span className="text-white font-medium">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Carousel */}
                    <div className="flex-1 overflow-hidden" ref={emblaRef}>
                        <div className="flex h-full">
                            {images.map((src, index) => (
                                <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full flex items-center justify-center">
                                    <ZoomableImage src={src} isActive={currentIndex === index} />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ZoomableImage = ({ src, isActive }: { src: string, isActive: boolean }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 }); // Start position of touch for drag
    const lastPos = useRef({ x: 0, y: 0 }); // Last 'committed' position after drag
    const startPinchDist = useRef<number | null>(null); // Distance between fingers
    const startScale = useRef(1); // Scale at start of pinch

    // Reset state when not active (user swiped away)
    useEffect(() => {
        if (!isActive) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            lastPos.current = { x: 0, y: 0 };
        }
    }, [isActive]);

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            // Pinch start
            const dist = getDistance(e.touches[0], e.touches[1]);
            startPinchDist.current = dist;
            startScale.current = scale;
            return;
        }

        if (e.touches.length === 1 && scale > 1) {
            // Drag start (only if zoomed in)
            setIsDragging(true);
            startPos.current = {
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            };
        }
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2 && startPinchDist.current) {
            // Pinch move
            const dist = getDistance(e.touches[0], e.touches[1]);
            const newScale = startScale.current * (dist / startPinchDist.current);
            // Limit scale
            setScale(Math.min(Math.max(1, newScale), 4));
            return;
        }

        if (e.touches.length === 1 && isDragging && scale > 1) {
            // Drag move
            e.preventDefault(); // Prevent scrolling
            const x = e.touches[0].clientX - startPos.current.x;
            const y = e.touches[0].clientY - startPos.current.y;

            // Limit drag boundaries based on scale
            // TODO: Better boundary math, for now simple unbounded or loose bounds
            setPosition({ x, y });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        startPinchDist.current = null;

        // Snap back if scale < 1
        if (scale < 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleDoubleTap = () => {
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setScale(2.5); // Zoom to 2.5x
        }
    };

    // Helper for double tap detection
    let lastTap = 0;
    const onTouchEndWrapper = (e: TouchEvent<HTMLDivElement>) => {
        handleTouchEnd();
        const now = Date.now();
        if (now - lastTap < 300) {
            handleDoubleTap();
        }
        lastTap = now;
    };

    const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
        return Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    };

    return (
        <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={onTouchEndWrapper}
        >
            <motion.img
                src={src}
                alt="Full screen view"
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                animate={{
                    scale: scale,
                    x: position.x,
                    y: position.y
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    // Disable transition during drag for direct 1:1 movement
                    scale: { duration: isDragging || startPinchDist.current ? 0 : 0.2 },
                    x: { duration: isDragging ? 0 : 0.2 },
                    y: { duration: isDragging ? 0 : 0.2 }
                }}
            />
        </div>
    );
};

export default FullScreenGallery;
