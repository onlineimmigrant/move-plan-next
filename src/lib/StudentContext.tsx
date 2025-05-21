// lib/StudentContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface StudentContextType {
  isStudent: boolean;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
  isStudent: false,
  isLoading: true,
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('StudentProvider: Fallback triggered after 5s');
      setIsLoading(false);
    }, 5000);

    const fetchProfile = async () => {
      try {
        // Wait for session to be fully loaded
        if (!session?.user?.id) {
          console.warn('StudentProvider: No valid session found');
          setIsStudent(false);
          return;
        }

        const userId = session.user.id;
        console.log('StudentProvider: Fetching profile for user:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_student')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('StudentProvider: Profile error:', error.message);
          setIsStudent(false);
          return;
        }

        console.log('StudentProvider: Profile fetched, is_student:', data.is_student);
        setIsStudent(data.is_student || false);
      } catch (err) {
        console.error('StudentProvider: Unexpected error:', err);
        setIsStudent(false);
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
    <StudentContext.Provider value={{ isStudent, isLoading }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudentStatus = () => useContext(StudentContext);