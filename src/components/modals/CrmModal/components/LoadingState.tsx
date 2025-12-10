'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}