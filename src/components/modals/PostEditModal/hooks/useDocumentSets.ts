// hooks/useDocumentSets.ts - Document sets management

import { useState, useEffect } from 'react';
import { getOrganizationId } from '@/lib/supabase';
import { DocumentSet } from '../types';

export function useDocumentSets(isOpen: boolean) {
  const [availableSets, setAvailableSets] = useState<DocumentSet[]>([]);

  useEffect(() => {
    const fetchDocumentSets = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const organizationId = await getOrganizationId(baseUrl);

        if (!organizationId) return;

        const response = await fetch(`${baseUrl}/api/document-sets?organization_id=${organizationId}`);

        if (response.ok) {
          const sets = await response.json();
          setAvailableSets(sets);
        }
      } catch (error) {
        console.error('Error fetching document sets:', error);
      }
    };

    if (isOpen) {
      fetchDocumentSets();
    }
  }, [isOpen]);

  return { availableSets };
}
