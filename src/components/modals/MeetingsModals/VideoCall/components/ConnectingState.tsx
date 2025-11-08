import React from 'react';

export default function ConnectingState() {
  return (
    <div
      className="shadow-2xl rounded-lg overflow-hidden fixed bg-gray-900"
      style={{ 
        zIndex: 10003,
        left: window.innerWidth / 2 - 200,
        top: window.innerHeight / 2 - 150,
        width: 400,
        height: 300
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg font-semibold mb-2">Connecting to meeting...</div>
          <div className="text-sm text-gray-400">Please wait</div>
        </div>
      </div>
    </div>
  );
}
