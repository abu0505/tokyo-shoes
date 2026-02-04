import { useState, useEffect } from 'react';

interface Position {
    x: number; // 0-1 percentage
    y: number; // 0-1 percentage
}

export const useImageBrightness = (imageUrl: string, position: Position = { x: 0.9, y: 0.1 }) => {
    const [isDark, setIsDark] = useState<boolean>(false); // Default to false (assume light for safety)

    useEffect(() => {
        if (!imageUrl) return;

        let isActive = true;
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Crucial for canvas manipulation

        img.onload = () => {
            if (!isActive) return;

            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Assuming a square aspect ratio container (1:1) as per UI analysis
                // This logic mimics 'object-fit: cover' centered
                const containerAspect = 1;
                const imgAspect = img.width / img.height;

                let sx, sy, sWidth, sHeight;

                if (imgAspect > containerAspect) {
                    // Image is wider than container
                    sHeight = img.height;
                    sWidth = img.height * containerAspect;
                    sy = 0;
                    sx = (img.width - sWidth) / 2;
                } else {
                    // Image is taller than container
                    sWidth = img.width;
                    sHeight = img.width / containerAspect;
                    sx = 0;
                    sy = (img.height - sHeight) / 2;
                }

                // Calculate sample position in source coordinates
                // position.x, position.y are relative to the Container (0 to 1)
                const sampleX = sx + (position.x * sWidth);
                const sampleY = sy + (position.y * sHeight);

                // Draw that single pixel
                ctx.drawImage(img, sampleX, sampleY, 1, 1, 0, 0, 1, 1);

                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

                // Calculate relative luminance
                // Formula: 0.2126 * R + 0.7152 * G + 0.0722 * B
                const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);

                // Threshold: < 128 is dark => White text
                // But let's be safer, maybe < 150 because shadows exist
                setIsDark(luminance < 140);

            } catch (e) {
                // CORs error or other issue
                // console.warn('Could not detect image brightness', e);
            }
        };

        img.src = imageUrl;

        return () => {
            isActive = false;
        };
    }, [imageUrl, position.x, position.y]);

    return isDark;
};
