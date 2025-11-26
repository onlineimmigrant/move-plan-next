/**
 * LoadingSpinner - Simple loading indicator
 */

'use client';

import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
