'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, getOrganizationId } from '@/lib/supabase';

interface AdminContextType {
  isAdmin: boolean;
  organizationId: string | null;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  organizationId: null,
  isLoading: true,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('AdminProvider: Fallback triggered after 5s');
      setIsLoading(false);
    }, 5000);

    const fetchProfile = async () => {
      try {
        if (!session?.user?.id) {
          console.warn('AdminProvider: No valid session found');
          setIsAdmin(false);
          setOrganizationId(null);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const currentOrgId = await getOrganizationId(baseUrl);
        if (!currentOrgId) {
          console.warn('AdminProvider: No organization found');
          setIsAdmin(false);
          setOrganizationId(null);
          return;
        }

        const userId = session.user.id;
        console.log('AdminProvider: Fetching profile for user:', userId, 'currentOrgId:', currentOrgId);
        const { data, error } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', userId)
          .eq('organization_id', currentOrgId)
          .single();

        if (error || !data) {
          console.error('AdminProvider: Profile error:', error?.message || 'Profile not found');
          setIsAdmin(false);
          setOrganizationId(null);
          return;
        }

        console.log('AdminProvider: Profile fetched, role:', data.role, 'organization_id:', data.organization_id);
        setIsAdmin(data.role === 'admin');
        setOrganizationId(data.organization_id || null);
      } catch (err) {
        console.error('AdminProvider: Unexpected error:', err);
        setIsAdmin(false);
        setOrganizationId(null);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
        console.log('AdminProvider: Loading complete, isLoading:', false);
      }
    };

    fetchProfile();
    return () => clearTimeout(timeout);
  }, [session]);

  return (
    <AdminContext.Provider value={{ isAdmin, organizationId, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdminStatus = () => useContext(AdminContext);