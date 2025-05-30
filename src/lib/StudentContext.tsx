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
  isLoading: true,
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [isStudent, setIsStudent] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const { data, error } = await supabase
          .from('profiles')
          .select('is_student, organization_id')
          .eq('id', userId)
          .eq('organization_id', currentOrgId)
          .single();

        if (error || !data) {
          console.error('StudentProvider: Profile error:', error?.message || 'Profile not found');
          setIsStudent(false);
          setOrganizationId(null);
          return;
        }

        console.log('StudentProvider: Profile fetched, is_student:', data.is_student, 'organization_id:', data.organization_id);
        setIsStudent(data.is_student || false);
        setOrganizationId(data.organization_id || null);
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