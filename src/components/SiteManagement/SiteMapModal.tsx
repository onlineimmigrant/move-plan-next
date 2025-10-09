// components/SiteManagement/SiteMapModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSiteMapModal } from '@/context/SiteMapModalContext';
import SiteMapTree from './SiteMapTree';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';
import { Organization } from './types';

export default function SiteMapModal() {
  const { isOpen, closeModal } = useSiteMapModal();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      loadOrganization();
    }
  }, [isOpen]);

  const loadOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Get current organization ID using helper
      const baseUrl = window.location.origin;
      const orgId = await getOrganizationId(baseUrl);

      if (!orgId) {
        throw new Error('Organization not found for current domain');
      }

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.error('Supabase error:', orgError);
        throw new Error(`Failed to fetch organization: ${orgError.message}`);
      }

      if (!orgData) {
        throw new Error('Organization data not found');
      }
      
      setOrganization(orgData);
    } catch (err) {
      console.error('Error loading organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Site Map</h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse your site's page structure
              </p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadOrganization}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : organization ? (
              <SiteMapTree 
                organization={organization}
                session={session}
                compact={true}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Organization not found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
