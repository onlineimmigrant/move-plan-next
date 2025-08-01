import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface AccessRestrictedProps {
  message?: string;
  subtitle?: string;
}

export default function AccessRestricted({ 
  message = "Access Restricted",
  subtitle = "You don't have permission to view site management features."
}: AccessRestrictedProps) {
  return (
    <div className="text-center py-20">
      <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
        <ShieldExclamationIcon className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{subtitle}</p>
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
