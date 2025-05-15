import React from 'react';

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <div className="flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-4 w-4 animate-bounce rounded-full bg-sky-500"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  </div>
);

export default LoadingIndicator;