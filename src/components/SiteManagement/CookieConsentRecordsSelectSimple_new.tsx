'use client';

import React from 'react';
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface CookieConsentRecord {
  id: number;
  created_at: string;
  ip_address?: string | null;
  consent_given: boolean;
  consent_data?: any | null;
  user_id: string;
  last_updated?: string | null;
  language_auto?: string | null;
}

interface CookieConsentRecordsSelectProps {
  value: CookieConsentRecord[];
  onChange: (records: CookieConsentRecord[]) => void;
  error?: string;
}

export const CookieConsentRecordsSelect: React.FC<CookieConsentRecordsSelectProps> = ({
  value = [],
  onChange,
  error
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Sort records by created_at desc (newest first)
  const sortedRecords = [...value].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="border rounded-xl p-4 bg-white/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">User Consent Records</h3>
            <p className="text-xs text-gray-600 mt-1">
              {value.length} consent record{value.length !== 1 ? 's' : ''} for this organization (read-only)
            </p>
          </div>
        </div>
        
        {sortedRecords && sortedRecords.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedRecords.slice(0, 10).map((record) => (
              <div 
                key={record.id} 
                className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-1.5 text-gray-400 rounded-lg bg-gray-100">
                      <DocumentTextIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          User {truncateText(record.user_id, 8)}
                        </span>
                        {record.consent_given ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 border border-green-200">
                            <CheckCircleIcon className="h-3 w-3" />
                            Consented
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                            <XCircleIcon className="h-3 w-3" />
                            Declined
                          </div>
                        )}
                        {record.language_auto && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {record.language_auto}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        <span>{formatDate(record.created_at)}</span>
                        {record.ip_address && (
                          <span>IP: {record.ip_address}</span>
                        )}
                        {record.last_updated && record.last_updated !== record.created_at && (
                          <span>Updated: {formatDate(record.last_updated)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                      ID: {record.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {sortedRecords.length > 10 && (
              <div className="text-center py-2 text-xs text-gray-500">
                ... and {sortedRecords.length - 10} more records
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-3">
              <DocumentTextIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm">No consent records found.</p>
            <p className="text-xs mt-1 text-gray-400">Records will appear as users interact with the cookie banner.</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
