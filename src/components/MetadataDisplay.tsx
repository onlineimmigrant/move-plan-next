'use client';

import { useEffect, useState } from 'react';

interface MetadataDisplayProps {
  title: string;
  data: Record<string, any>;
}

export default function MetadataDisplay({ title, data }: MetadataDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-full text-left p-3 font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
      >
        <span className="text-sm">{title}</span>
        <span className="text-gray-500 text-xs">
          {isVisible ? '▼ Hide' : '▶ Show'}
        </span>
      </button>
      
      {isVisible && (
        <div className="border-t border-gray-300">
          <pre className="text-xs bg-white p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
