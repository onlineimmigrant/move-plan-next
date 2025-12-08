// ui/CloseButton.tsx
import React from 'react';

interface CloseButtonProps {
  onClick?: () => void;
  className?: string; // Optional className for additional styling
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`}
      aria-label="Close"
    >
      <svg
        className="h-5 w-5 text-gray-600"
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
    </button>
  );
};

export default CloseButton;