import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
  withContainer?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = 'w-8 h-8 text-rose-600',
  size = 32,
  withContainer = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded squircle container border */}
      {withContainer && (
        <rect
          x="7"
          y="7"
          width="86"
          height="86"
          rx="24"
          stroke="currentColor"
          strokeWidth="7"
          fill="none"
        />
      )}

      {/* Filmstrip Left Piece */}
      <g transform="rotate(-12 35 55)">
        <rect x="16" y="44" width="28" height="21" rx="2" fill="currentColor" />
        {/* Sprockets Top & Bottom */}
        <rect x="19" y="46.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="27" y="46.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="35" y="46.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="19" y="58.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="27" y="58.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="35" y="58.5" width="4" height="4" rx="0.8" fill="#000000" />
      </g>

      {/* Filmstrip Right Piece */}
      <g transform="rotate(-12 68 47)">
        <rect x="54" y="37" width="28" height="21" rx="2" fill="currentColor" />
        {/* Sprockets Top & Bottom */}
        <rect x="57" y="39.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="65" y="39.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="73" y="39.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="57" y="51.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="65" y="51.5" width="4" height="4" rx="0.8" fill="#000000" />
        <rect x="73" y="51.5" width="4" height="4" rx="0.8" fill="#000000" />
      </g>

      {/* Scissors */}
      <g>
        {/* Top Handle Ring */}
        <circle cx="34" cy="30" r="9" stroke="currentColor" strokeWidth="5" fill="none" />
        {/* Bottom Handle Ring */}
        <circle cx="33" cy="62" r="9" stroke="currentColor" strokeWidth="5" fill="none" />

        {/* Diagonal Cutting Blade crossing downwards-right */}
        <path
          d="M 37 36 L 65 65"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Lower Blade pointing downwards right cutting film */}
        <path
          d="M 38 56 L 64 36"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Pivot Joint Point */}
        <circle cx="48" cy="48" r="2.5" fill="#ffffff" />
      </g>
    </svg>
  );
};
