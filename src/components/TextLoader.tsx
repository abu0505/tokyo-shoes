import React from 'react';

interface TextLoaderProps {
    text?: string;
    className?: string;
    isWhite?: boolean;
    showDots?: boolean;
}

const TextLoader = ({ text = 'Loading', className = '', isWhite = false, showDots = true }: TextLoaderProps) => {
    // Define style for white text variant to override CSS variables
    const baseStyle = isWhite ? {
        '--shimmer-c1': '#ffffff',
        '--shimmer-c2': '#aaaaaa'
    } as React.CSSProperties : {};

    const textChars = text.split('');
    const charCount = textChars.length;

    // If text is empty, we just show dots with wave animation
    const dotsDelayOffset = charCount > 0 ? charCount * 0.1 : 0;

    return (
        <div className={`flex items-center justify-center ${className}`} style={baseStyle}>
            <div className="flex items-baseline">
                {/* Text characters with localized wave animation */}
                {textChars.map((char, index) => (
                    <span
                        key={`char-${index}`}
                        className="animate-text-shimmer font-medium inline-block"
                        style={{
                            ...baseStyle,
                            animation: `text-shimmer 2.5s ease-in-out infinite, wave-jump 2.5s ease-in-out infinite`,
                            animationDelay: `${index * 0.1}s` // Stagger the wave and shimmer per character
                        }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                ))}

                {/* Static dots with WAVE animation (synchronized with text) */}
                {showDots && (
                    <div className={`flex ${charCount > 0 ? 'ml-0.5' : ''}`}>
                        {[0, 1, 2].map((i) => (
                            <span
                                key={`dot-${i}`}
                                className="animate-text-shimmer font-medium inline-block mx-[1px]"
                                style={{
                                    ...baseStyle,
                                    // Removed dot-blink, added wave-jump to match text
                                    animation: `text-shimmer 2.5s ease-in-out infinite, wave-jump 2.5s ease-in-out infinite`,
                                    animationDelay: `${dotsDelayOffset + (i * 0.1)}s`
                                }}
                            >
                                .
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextLoader;
