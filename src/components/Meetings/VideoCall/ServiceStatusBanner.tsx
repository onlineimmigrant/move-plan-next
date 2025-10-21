'use client';

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ServiceStatusBannerProps {
  error?: string;
}

export default function ServiceStatusBanner({ error }: ServiceStatusBannerProps) {
  const isTwilioServiceError = error?.includes('Service is unavailable') || 
                                error?.includes('Invalid Access Token') ||
                                error?.includes('Authorization error');

  if (!isTwilioServiceError) return null;

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            Video Service Temporarily Unavailable
          </h3>
          <p className="text-xs text-yellow-700 mb-2">
            Twilio Video is currently experiencing service disruptions due to infrastructure issues. 
            This is affecting room creation and video connections.
          </p>
          <div className="flex flex-col gap-1 text-xs text-yellow-600">
            <p>• Room creation may fail or timeout</p>
            <p>• Video connections may not establish</p>
            <p>• Token authentication may be delayed</p>
          </div>
          <a 
            href="https://status.twilio.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs font-medium text-yellow-800 hover:text-yellow-900 underline"
          >
            Check Twilio Service Status →
          </a>
        </div>
      </div>
    </div>
  );
}
