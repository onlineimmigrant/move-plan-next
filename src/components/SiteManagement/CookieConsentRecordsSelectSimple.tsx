'use client';

import React from 'react';

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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">User Consent Records</h3>
        <p className="text-sm text-gray-600 mb-4">
          Historical record of user consent decisions for this organization.
        </p>
        
        {value && value.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {value.map((record) => (
              <div key={record.id} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${record.consent_given ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {record.consent_given ? 'Consent Given' : 'Consent Denied'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(record.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      <span>User: {record.user_id.substring(0, 8)}...</span>
                      {record.ip_address && (
                        <span className="ml-3">IP: {record.ip_address}</span>
                      )}
                      {record.language_auto && (
                        <span className="ml-3">Language: {record.language_auto}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    ID: {record.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No consent records found for this organization.</p>
            <p className="text-xs mt-1">Consent records will be loaded from the database.</p>
          </div>
        )}
        
        {error && (
          <div className="mt-3 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};
