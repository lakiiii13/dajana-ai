// ===========================================
// DAJANA AI - Auth Store (Zustand)
// ===========================================

import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { setLanguage as setI18nLanguage, getLanguage } from '@/lib/i18n';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserCredits = Database['public']['Tables']['user_credits']['Row'];
type Language = 'sr' | 'en';

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  credits: UserCredits | null;
  isLoading: boolean;
  isInitialized: boolean;
  language: Language;

  // Actions
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  fetchCredits: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  session: null,
  user: null,
  profile: null,
  credits: null,
  isLoading: true,
  isInitialized: false,
  language: 'sr' as Language,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });
        await get().fetchProfile();
        await get().fetchCredits();
      }

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
    if (session) {
      get().fetchProfile();
      get().fetchCredits();
    } else {
      get().reset();
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile: data });
      
      // Set language from profile if available
      if (data?.language) {
        const lang = data.language as Language;
        setI18nLanguage(lang);
        set({ language: lang });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  },

  fetchCredits: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      set({ credits: data });
    } catch (error) {
      console.error('Fetch credits error:', error);
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  setLanguage: async (lang: Language) => {
    const { user } = get();
    
    // Always update i18n immediately for UI
    setI18nLanguage(lang);
    set({ language: lang });

    // If logged in, save to database
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ language: lang, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (error) {
        console.error('Save language error:', error);
      }
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      get().reset();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  reset: () => {
    set({
      session: null,
      user: null,
      profile: null,
      credits: null,
      isLoading: false,
    });
  },
}));
