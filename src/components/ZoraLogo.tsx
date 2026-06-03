import React, { useState } from 'react';

interface ZoraLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export const ZoraLogo: React.FC<ZoraLogoProps> = ({
  variant = 'full',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Robust SVG fallback to keep layout pristine in case image_0.png is loading or unresolvable
  if (hasError) {
    if (variant === 'icon') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="150 70 200 220"
          className={className || "h-10 w-10"}
          id="zora-logo-svg-icon-fallback"
        >
          <defs>
            <linearGradient id="iconTopRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0531A" />
              <stop offset="100%" stopColor="#FA6A2D" />
            </linearGradient>
            
            <linearGradient id="iconDiagonalRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA6A2D" />
              <stop offset="60%" stopColor="#E0531A" />
              <stop offset="100%" stopColor="#B83A09" />
            </linearGradient>

            <linearGradient id="iconBottomRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D64912" />
              <stop offset="100%" stopColor="#ED5B22" />
            </linearGradient>
          </defs>

          {/* 1. THE ARCH (Brown Outline Frame) */}
          <path 
            d="M 165 275 L 165 170 A 85 85 0 0 1 335 170 L 335 275 Z" 
            fill="none" 
            stroke="#5C3A21" 
            strokeWidth="12" 
            strokeLinejoin="miter" 
            strokeLinecap="square"
          />

          {/* 2. THE 'Z' RIBBON SHAPE */}
          <polygon points="195,135 290,135 325,170 195,170" fill="url(#iconTopRibbon)" />
          <polygon points="325,170 230,265 195,230 290,135" fill="url(#iconDiagonalRibbon)" />
          <polygon points="195,230 305,230 305,265 230,265" fill="url(#iconBottomRibbon)" />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        className={className || "w-full max-w-[320px] h-auto"}
        id="zora-logo-svg-full-fallback"
      >
        <defs>
          <linearGradient id="fullTopRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E0531A" />
            <stop offset="100%" stopColor="#FA6A2D" />
          </linearGradient>
          
          <linearGradient id="fullDiagonalRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA6A2D" />
            <stop offset="60%" stopColor="#E0531A" />
            <stop offset="100%" stopColor="#B83A09" />
          </linearGradient>

          <linearGradient id="fullBottomRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D64912" />
            <stop offset="100%" stopColor="#ED5B22" />
          </linearGradient>
        </defs>

        {/* 1. THE ARCH (Brown Outline Frame) */}
        <path 
          d="M 165 275 L 165 170 A 85 85 0 0 1 335 170 L 335 275 Z" 
          fill="none" 
          stroke="#5C3A21" 
          strokeWidth="12" 
          strokeLinejoin="miter" 
          strokeLinecap="square"
        />

        {/* 2. THE 'Z' RIBBON SHAPE */}
        <polygon points="195,135 290,135 325,170 195,170" fill="url(#fullTopRibbon)" />
        <polygon points="325,170 230,265 195,230 290,135" fill="url(#fullDiagonalRibbon)" />
        <polygon points="195,230 305,230 305,265 230,265" fill="url(#fullBottomRibbon)" />

        {/* 3. BRAND TYPOGRAPHY */}
        <text 
          x="250" 
          y="340" 
          fontFamily="'Montserrat', sans-serif" 
          fontWeight="900" 
          fontSize="44" 
          fill="#F26522" 
          textAnchor="middle" 
          letterSpacing="1"
        >
          ZORA STAYS
        </text>

        <line x1="85" y1="395" x2="115" y2="395" stroke="#D3C7BE" strokeWidth="1" />
        <line x1="385" y1="395" x2="415" y2="395" stroke="#D3C7BE" strokeWidth="1" />

        <text 
          x="250" 
          y="400" 
          fontFamily="'Inter', sans-serif" 
          fontWeight="500" 
          fontSize="15.5" 
          fill="#3A2312" 
          textAnchor="middle" 
          letterSpacing="5.5"
        >
          SMART LIVING FOR HER
        </text>
      </svg>
    );
  }

  // Render the requested transparent image_0.png logo
  return (
    <img
      src="/image_0.png"
      alt="Zora Stays Logo"
      className={`${className} object-contain`}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      id="zora-logo-image"
    />
  );
};
