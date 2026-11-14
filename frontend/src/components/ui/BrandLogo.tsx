import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  dark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  textSize = 'md',
  dark = false,
}) => {
  const fontSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Modern, high-craft geometric emblem: Layered academic cap & project tracker prism */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 transform group-hover:scale-105 transition-transform duration-200"
        >
          {/* Background rounded prism container */}
          <rect width="40" height="40" rx="10" fill="#20144d" />
          
          {/* Top Diamond / Cap Rhombus with golden-amber accent */}
          <path
            d="M20 9L31 16L20 23L9 16L20 9Z"
            fill="url(#acad_grad_top)"
          />
          {/* Left Facet */}
          <path
            d="M9 16L20 23V31L9 24V16Z"
            fill="#4338ca"
          />
          {/* Right Facet */}
          <path
            d="M20 23L31 16V24L20 31V23Z"
            fill="#6366f1"
          />
          {/* Central golden-amber milestone star/dot */}
          <circle cx="20" cy="16" r="2.5" fill="#f59e0b" />

          {/* Tassel / dynamic line in vibrant amber */}
          <path
            d="M31 16V25C31 26.5 29.5 27 28.5 27"
            stroke="#f59e0b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="acad_grad_top" x1="9" y1="9" x2="31" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span
          className={`font-black tracking-tight ${
            dark ? 'text-white' : 'text-slate-900'
          } ${fontSizes[textSize]}`}
        >
          Acad<span className="text-[#f59e0b]">Track</span>
        </span>
      )}
    </Link>
  );
};
