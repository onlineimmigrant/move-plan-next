/**
 * TestimonialsView Component
 *
 * Displays and manages testimonials
 * Part of the CRM modal - Testimonials tab
 */

'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface TestimonialsViewProps {
  organizationId?: string;
}

export default function TestimonialsView({ organizationId }: TestimonialsViewProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Testimonials Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Testimonials curation coming soon...
        </p>
      </div>
    </div>
  );
}