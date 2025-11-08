import React from 'react';

interface ConnectionErrorProps {
  error: string;
  onClose: () => void;
}

export default function ConnectionError({ error, onClose }: ConnectionErrorProps) {
  return (
    <div
      className="shadow-2xl rounded-lg overflow-hidden fixed bg-red-50"
      style={{ 
        zIndex: 10003,
        left: window.innerWidth / 2 - 200,
        top: window.innerHeight / 2 - 150,
        width: 400,
        height: 300
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Connection Error</div>
          <div className="text-red-500">{error}</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
