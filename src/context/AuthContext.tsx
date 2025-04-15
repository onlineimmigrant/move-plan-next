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
      console.log('Initial session:', data.session);
      // Log cookies after fetching session
      console.log('Cookies after fetching session:', document.cookie);
    });

    // 2) Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      console.log('Auth state changed:', event, newSession);
      // Log cookies after auth state change
      console.log('Cookies after auth state change:', document.cookie);
    });

    // 3) Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add a login helper
  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    console.log('Login successful:', data);
    setSession(data.session);
    // Log cookies after login
    console.log('Cookies after login:', document.cookie);
    return data;
  }

  // Logout helper
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    setSession(null);
    console.log('Cookies after logout:', document.cookie);
  }

  // Provide session, setSession, login, and logout
  return (
    <AuthContext.Provider value={{ session, setSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}