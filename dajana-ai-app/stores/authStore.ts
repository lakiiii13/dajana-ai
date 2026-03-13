// ===========================================
// DAJANA AI - Auth Store (Zustand)
// ===========================================

import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase, supabaseConfigError } from '@/lib/supabase';
import { Database } from '@/types/database';
import { setLanguage as setI18nLanguage, getLanguage } from '@/lib/i18n';
import { getAllCredits, type AllCredits } from '@/lib/creditService';
import { getSubscription, type SubscriptionInfo } from '@/lib/subscriptionService';
import { clearAllLocalTryOnData } from '@/lib/tryOnService';
import { clearAllLocalVideos } from '@/lib/videoService';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserCredits = Database['public']['Tables']['user_credits']['Row'];
type Language = 'sr' | 'en';

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  credits: UserCredits | null;
  /** Krediti za prikaz (Slike / Video / Analize) – osvežava se posle skidanja i pri fokusu. */
  allCredits: AllCredits | null;
  /** Aktivna pretplata – kad istekne, korisnica vidi sadržaj ali ne može generisati novo. */
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  isInitialized: boolean;
  language: Language;
  /** Gost je ušao bez prijave – vidi samo Početnu, ostalo blokirano modalom. */
  isGuest: boolean;
  /** Jednokratno: prikaži guest modal (npr. kad gost sa home-a tapne notifikacije). */
  guestShowModal: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setGuest: (value: boolean) => void;
  setGuestShowModal: (value: boolean) => void;
  fetchProfile: () => Promise<void>;
  fetchCredits: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
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
  allCredits: null as AllCredits | null,
  subscription: null as SubscriptionInfo | null,
  isLoading: true,
  isInitialized: false,
  language: 'sr' as Language,
  isGuest: false,
  guestShowModal: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  initialize: async () => {
    try {
      set({ isLoading: true });

      if (!hasSupabaseConfig) {
        console.warn('[Auth] Initialization skipped:', supabaseConfigError);
        set({ isInitialized: true, isLoading: false });
        return;
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });
        await get().fetchProfile();
        await get().fetchCredits();
        await get().fetchSubscription();
      }

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  setSession: (session) => {
    if (session) {
      set({ session, user: session.user, isGuest: false });
      get().fetchProfile();
      get().fetchCredits();
      get().fetchSubscription();
    } else {
      // Ako je korisnik izabrao "Nastavi kao gost", ne briši isGuest – inače ga auth listener vrati na login
      if (get().isGuest) {
        set({ session: null, user: null });
      } else {
        get().reset();
      }
    }
  },

  setGuest: (value) => {
    set({ isGuest: value });
  },

  setGuestShowModal: (value) => {
    set({ guestShowModal: value });
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
      const allCredits = await getAllCredits(user.id);
      set({ allCredits });
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!error) set({ credits: data });
    } catch (error) {
      console.error('Fetch credits error:', error);
    }
  },

  fetchSubscription: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const subscription = await getSubscription(user.id);
      set({ subscription });
    } catch (error) {
      console.error('Fetch subscription error:', error);
      set({ subscription: { active: false, status: 'expired', planType: null, currentPeriodEnd: null } });
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
      // Clear local try-on images, outfits and videos so next user doesn't see previous user's data
      await Promise.all([clearAllLocalTryOnData(), clearAllLocalVideos()]).catch((e) =>
        console.warn('Clear local data on signOut:', e)
      );
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
      allCredits: null,
      subscription: null,
      isLoading: false,
      isGuest: false,
      guestShowModal: false,
    });
  },
}));
