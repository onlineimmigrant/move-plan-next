// lib/StudentContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, getOrganizationId } from '@/lib/supabase';

interface StudentContextType {
  isStudent: boolean;
  organizationId: string | null;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
  isStudent: false,
  organizationId: null,
  isLoading: false,
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [isStudent, setIsStudent] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('StudentProvider: Fallback triggered after 5s');
      setIsLoading(false);
    }, 5000);

    const fetchProfile = async () => {
      try {
        if (!session?.user?.id) {
          console.warn('StudentProvider: No valid session found');
          setIsStudent(false);
          setOrganizationId(null);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const currentOrgId = await getOrganizationId(baseUrl);
        if (!currentOrgId) {
          console.warn('StudentProvider: No organization found');
          setIsStudent(false);
          setOrganizationId(null);
          return;
        }

        const userId = session.user.id;
        console.log('StudentProvider: Fetching profile for user:', userId, 'currentOrgId:', currentOrgId);
        
        // Use select() without .single() to handle multiple or no rows gracefully
        const { data, error } = await supabase
          .from('profiles')
          .select('is_student, organization_id')
          .eq('id', userId)
          .eq('organization_id', currentOrgId);

        if (error) {
          // Suppress common development errors (network issues during hot reload)
          if (!error.message?.includes('Failed to fetch') && 
              !error.message?.includes('Network request failed')) {
            console.error('StudentProvider: Database error:', error.message);
          }
          setIsStudent(false);
          setOrganizationId(null);
          return;
        }

        // Handle no rows found
        if (!data || data.length === 0) {
          console.warn('StudentProvider: No profile found for user in current organization');
          setIsStudent(false);
          setOrganizationId(null);
          return;
        }

        // Handle multiple rows (shouldn't happen, but take the first one)
        if (data.length > 1) {
          console.warn(`StudentProvider: Multiple profiles found (${data.length}), using the first one`);
        }

        const profile = data[0];
        console.log('StudentProvider: Profile fetched, is_student:', profile.is_student, 'organization_id:', profile.organization_id);
        setIsStudent(profile.is_student || false);
        setOrganizationId(profile.organization_id || null);
      } catch (err) {
        console.error('StudentProvider: Unexpected error:', err);
        setIsStudent(false);
        setOrganizationId(null);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
        console.log('StudentProvider: Loading complete, isLoading:', false);
      }
    };

    fetchProfile();
    return () => clearTimeout(timeout);
  }, [session]);

  return (
    <StudentContext.Provider value={{ isStudent, organizationId, isLoading }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudentStatus = () => useContext(StudentContext);