/**
 * LeadsView Component
 *
 * Displays and manages leads
 * Part of the CRM modal - Leads tab
 */

'use client';

import React from 'react';
import { Target } from 'lucide-react';

interface LeadsViewProps {
  organizationId?: string;
}

export default function LeadsView({ organizationId }: LeadsViewProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Leads Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Lead capture and management coming soon...
        </p>
      </div>
    </div>
  );
}