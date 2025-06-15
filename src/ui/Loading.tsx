import React from 'react';

interface LoadingProps {
  className?: string; // Optional className for the container
  dotColor1?: string; // Optional color for the dots (defaults to bg-sky-600)
  dotColor2?: string;
  dotColor3?: string;
  dotSize?: string; // Optional size for the dots (defaults to w-4 h-4)
}

const Loading: React.FC<LoadingProps> = ({
  className = '',
  dotColor1 = 'bg-sky-400',
  dotColor2 = 'bg-sky-500',
  dotColor3 = 'bg-sky-600',
  dotSize = 'w-4 h-4',
}) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`${dotSize} ${dotColor1} rounded-full animate-bounce`}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={`${dotSize} ${dotColor2} rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className={`${dotSize} ${dotColor3} rounded-full animate-bounce`}
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
  );
};

export default Loading;