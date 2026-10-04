import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
  withContainer?: boolean;
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = 'w-8 h-8',
  size,
}) => {
  return (
    <img
      src="/logo-icon.png"
      alt="EditorCut Logo"
      width={size}
      height={size}
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  );
};
