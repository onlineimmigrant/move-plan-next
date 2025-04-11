'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1) Check current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // 2) Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // 3) Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Example: a logout helper
  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  // Provide session + setSession for manual updates
  return (
    <AuthContext.Provider value={{ session, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}