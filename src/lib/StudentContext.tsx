// lib/StudentContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('StudentProvider: Fallback triggered after 5s');
      setIsLoading(false);
    }, 5000);

    const fetchProfile = async () => {
      try {
        console.log('StudentProvider: Fetching session');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('StudentProvider: Session error:', sessionError.message);
          return;
        }
        if (!session) {
          console.warn('StudentProvider: No session found');
          return;
        }

        console.log('StudentProvider: Fetching profile for user:', session.user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_student')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('StudentProvider: Profile error:', error.message);
          return;
        }

        console.log('StudentProvider: Profile fetched, is_student:', data.is_student);
        setIsStudent(data.is_student || false);
      } catch (err) {
        console.error('StudentProvider: Unexpected error:', err);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
        console.log('StudentProvider: Loading complete, isLoading:', false);
      }
    };

    fetchProfile();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <StudentContext.Provider value={{ isStudent, isLoading }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudentStatus = () => useContext(StudentContext);