// ===========================================
// DAJANA AI - Auth Store (Zustand)
// ===========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase, supabaseConfigError } from '@/lib/supabase';
import { Database } from '@/types/database';
import { setLanguage as setI18nLanguage, getLanguage } from '@/lib/i18n';

const LANGUAGE_PREF_KEY = '@dajana_language_preference';
import { getAllCredits, type AllCredits } from '@/lib/creditService';
import { getSubscription, type SubscriptionInfo } from '@/lib/subscriptionService';
import { clearBackgroundJob } from '@/lib/backgroundVideoTask';
import { useTryOnStore } from '@/stores/tryOnStore';

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

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });
        await get().fetchProfile();
        await get().fetchCredits();
        await get().fetchSubscription();
      } else {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_PREF_KEY);
        if (storedLang === 'sr' || storedLang === 'en') {
          setI18nLanguage(storedLang as Language);
          set({ language: storedLang as Language });
        }
      }

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  setSession: (session) => {
    if (session) {
      const prevUserId = get().user?.id;
      const newUserId = session.user.id;
      if (prevUserId && prevUserId !== newUserId) {
        useTryOnStore.getState().reset();
      }
      set({ session, user: session.user, isGuest: false });
      get().fetchProfile();
      get().fetchCredits();
      get().fetchSubscription();
    } else {
      useTryOnStore.getState().reset();
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

      // Prefer language from welcome screen (before signup) over profile default
      const storedPref = await AsyncStorage.getItem(LANGUAGE_PREF_KEY);
      if (storedPref === 'sr' || storedPref === 'en') {
        const lang = storedPref as Language;
        setI18nLanguage(lang);
        set({ language: lang });
        await AsyncStorage.removeItem(LANGUAGE_PREF_KEY);
        await supabase.from('profiles').update({ language: lang, updated_at: new Date().toISOString() }).eq('id', user.id);
        set({ profile: { ...data, language: lang } });
      } else if (data?.language) {
        // Only apply profile language when store is still default – avoid overwriting EN chosen on welcome
        // (second fetchProfile can run before DB update is visible, so profile may still say 'sr')
        const currentLang = get().language;
        if (currentLang === 'sr') {
          const lang = data.language as Language;
          setI18nLanguage(lang);
          set({ language: lang });
        } else {
          setI18nLanguage(currentLang);
        }
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

    setI18nLanguage(lang);
    set({ language: lang });

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ language: lang, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) {
        console.error('Save language error:', error.message);
      }
      await AsyncStorage.removeItem(LANGUAGE_PREF_KEY);
    } else {
      await AsyncStorage.setItem(LANGUAGE_PREF_KEY, lang);
    }
  },

  signOut: async () => {
    try {
      await clearBackgroundJob().catch((e) =>
        console.warn('Clear background job on signOut:', e)
      );
      useTryOnStore.getState().reset();
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
