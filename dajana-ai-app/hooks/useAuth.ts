// ===========================================
// DAJANA AI - Auth Hook
// ===========================================

import { useEffect } from 'react';
import { hasSupabaseConfig, supabase, supabaseConfigError } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const {
    session,
    user,
    profile,
    credits,
    allCredits,
    subscription,
    isLoading,
    isInitialized,
    language,
    isGuest,
    initialize,
    setSession,
    setGuest,
    fetchProfile,
    fetchCredits,
    fetchSubscription,
    updateProfile,
    setLanguage,
    signOut,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }

    if (!hasSupabaseConfig) {
      console.warn('[Auth] Listener skipped:', supabaseConfigError);
      return;
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
    allCredits,
    isLoading,
    isInitialized,
    language,
    isGuest,
    isAuthenticated: !!session,
    hasProfile: !!profile,
    hasDajanaAnalysis: profile?.has_dajana_analysis ?? false,
    subscription,
    hasActiveSubscription: subscription?.active ?? false,

    // Actions
    setGuest,
    fetchProfile,
    fetchCredits,
    fetchSubscription,
    updateProfile,
    setLanguage,
    signOut,
  };
}

// ===========================================
// Auth Helper Functions
// ===========================================

export async function signInWithEmail(email: string, password: string) {
  if (!hasSupabaseConfig) throw new Error(supabaseConfigError);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  if (!hasSupabaseConfig) throw new Error(supabaseConfigError);
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
  if (!hasSupabaseConfig) throw new Error(supabaseConfigError);
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  if (!hasSupabaseConfig) throw new Error(supabaseConfigError);
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}
