/**
 * ReviewsView Component
 *
 * Displays and manages customer reviews
 * Part of the CRM modal - Reviews tab
 */

'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ReviewsViewProps {
  organizationId?: string;
}

export default function ReviewsView({ organizationId }: ReviewsViewProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Reviews Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customer reviews management coming soon...
        </p>
      </div>
    </div>
  );
}