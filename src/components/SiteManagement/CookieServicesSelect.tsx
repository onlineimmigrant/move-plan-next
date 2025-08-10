'use client';

import React from 'react';

interface CookieService {
  id: number;
  name: string;
  description: string;
  active: boolean;
  processing_company?: string | null;
  data_processor_cookie_policy_url?: string | null;
  data_processor_privacy_policy_url?: string | null;
  data_protection_officer_contact?: string | null;
  retention_period?: string | null;
  category_id: number;
  organization_id: string;
}

interface CookieServicesSelectProps {
  value: CookieService[];
  onChange: (services: CookieService[]) => void;
  error?: string;
  availableCategories?: any[];
}

export const CookieServicesSelect: React.FC<CookieServicesSelectProps> = ({
  value = [],
  onChange,
  error,
  availableCategories = []
}) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Organization Cookie Services</h3>
        <p className="text-sm text-gray-600 mb-4">
          These are the cookie services specific to this organization.
        </p>
        
        {value && value.length > 0 ? (
          <div className="space-y-3">
            {value.map((service) => (
              <div key={service.id} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${service.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Category ID: {service.category_id}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    ID: {service.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No cookie services found for this organization.</p>
            <p className="text-xs mt-1">Cookie services will be loaded from the database.</p>
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
