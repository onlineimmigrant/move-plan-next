// components/modals/SiteMapModal/SiteMapModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSiteMapModal } from './context';
import { BaseModal } from '@/components/modals/_shared';
import SiteMapTree from '@/components/SiteManagement/SiteMapTree';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';
import { Organization } from '@/components/SiteManagement/types';

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
    <BaseModal
      isOpen={isOpen}
      onClose={closeModal}
      title="Site Map"
      subtitle="Browse your site's page structure"
      size="xl"
      secondaryAction={{
        label: "Close",
        onClick: closeModal
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading site structure...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOrganization}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
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
    </BaseModal>
  );
}
