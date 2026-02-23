// ===========================================
// DAJANA AI - Auth Hook
// ===========================================

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    session,
    user,
    profile,
    credits,
    isLoading,
    isInitialized,
    language,
    initialize,
    setSession,
    fetchProfile,
    fetchCredits,
    updateProfile,
    setLanguage,
    signOut,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    profile,
    credits,
    isLoading,
    isInitialized,
    language,
    isAuthenticated: !!session,
    hasProfile: !!profile,
    hasDajanaAnalysis: profile?.has_dajana_analysis ?? false,
    
    // Actions
    fetchProfile,
    fetchCredits,
    updateProfile,
    setLanguage,
    signOut,
  };
}

// ===========================================
// Auth Helper Functions
// ===========================================

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}
