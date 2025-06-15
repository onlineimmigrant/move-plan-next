// ui/CloseButton.tsx
import React from 'react';

interface CloseButtonProps {
  className?: string; // Optional className for additional styling
}

const CloseButton: React.FC<CloseButtonProps> = ({ className = '' }) => {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
};

export default CloseButton;