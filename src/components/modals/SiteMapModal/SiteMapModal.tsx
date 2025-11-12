// components/modals/SiteMapModal/SiteMapModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import { useSiteMapModal } from './context';
import { 
  StandardModalContainer,
  StandardModalHeader,
  StandardModalBody,
  StandardModalFooter,
  LoadingState,
  ErrorState,
  EmptyState,
  type ModalAction
} from '@/components/modals/_shared';
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

  const secondaryAction: ModalAction = {
    label: "Close",
    onClick: closeModal,
    variant: 'secondary',
  };

  return (
    <StandardModalContainer
      isOpen={isOpen}
      onClose={closeModal}
      size="large"
      enableDrag={true}
      enableResize={true}
      ariaLabel="Site Map Modal"
    >
      <StandardModalHeader
        title="Site Map"
        subtitle="Browse your site's page structure"
        icon={MapIcon}
        iconColor="text-blue-500"
        onClose={closeModal}
      />

      <StandardModalBody>
        {isLoading ? (
          <LoadingState 
            message="Loading site structure..." 
            size="lg"
          />
        ) : error ? (
          <ErrorState
            title="Failed to Load"
            message={error}
            onRetry={loadOrganization}
          />
        ) : organization ? (
          <SiteMapTree 
            organization={organization}
            session={session}
            compact={true}
          />
        ) : (
          <EmptyState
            title="Organization Not Found"
            message="No organization data available"
          />
        )}
      </StandardModalBody>

      <StandardModalFooter
        secondaryAction={secondaryAction}
        align="right"
      />
    </StandardModalContainer>
  );
}
