/**
 * AccountsView Component
 *
 * Displays and manages all user accounts
 * Part of the CRM modal - Accounts tab
 */

'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface AccountsViewProps {
  organizationId?: string;
}

export default function AccountsView({ organizationId }: AccountsViewProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Accounts Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          User accounts management coming soon...
        </p>
      </div>
    </div>
  );
}