import React from 'react';

interface LeftArrowDynamicProps {
  className?: string; // Optional className for additional styling
}

const LeftArrowDynamic: React.FC<LeftArrowDynamicProps> = ({ className = '' }) => {
  return (
    <svg
      className={`w-3 h-3 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
};

export default LeftArrowDynamic;