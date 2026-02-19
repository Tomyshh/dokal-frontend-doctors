'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import type { SubscriptionStatus } from '@/lib/subscription';
import { getSubscriptionStatus } from '@/lib/subscription';
import api from '@/lib/api';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import { useLocale } from 'next-intl';
import { LogoutScreen } from '@/components/LogoutScreen';

// ─── Context Type ────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscriptionStatus: SubscriptionStatus | null;
  /** true while the initial session + profile + subscription is being resolved */
  loading: boolean;
  loggingOut: boolean;
  signOut: () => Promise<void>;
  /** Refetch profile + subscription from backend (keeps session). */
  refreshUserData: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  subscriptionStatus: null,
  loading: true,
  loggingOut: false,
  signOut: async () => {},
  refreshUserData: async () => {},
  refreshSubscription: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Provider ────────────────────────────────────────────────────────

/** Max time (ms) we wait for profile+subscription before unblocking the UI */
const INIT_TIMEOUT_MS = 8_000;

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const locale = useLocale();

  // Prevent double-init in React strict mode
  const initRef = useRef(false);

  // ─── Helpers ─────────────────────────────────────────────────────

  const fetchUserData = useCallback(async () => {
    // CRM app = practitioners only. GET /profile is for patients (requirePatient) → 403.
    // Use GET /practitioners/me first to avoid 403.
    let profileData: Profile | null = null;

    try {
      const practitioner = await getMyPractitionerOrNull();
      const supabase = createClient();
      const { data: { session: sess } } = await supabase.auth.getSession();
      const user = sess?.user;

      if (practitioner && user) {
        profileData = {
          id: user.id,
          first_name: practitioner.profiles?.first_name ?? null,
          last_name: practitioner.profiles?.last_name ?? null,
          email: practitioner.email ?? user.email ?? null,
          phone: practitioner.phone ?? null,
          date_of_birth: null,
          sex: null,
          city: practitioner.city ?? null,
          avatar_url: practitioner.profiles?.avatar_url ?? null,
          role: 'practitioner',
          created_at: practitioner.created_at ?? '',
          updated_at: practitioner.updated_at ?? '',
        };
      }
    } catch {
      // 404 or error — try bootstrap for new practitioners (Google OAuth)
      try {
        const bootstrapRes = await api.post<Profile>('/crm/auth/bootstrap');
        profileData = bootstrapRes.data;
      } catch {
        // Bootstrap failed — profile stays null
      }
    }

    setProfile(profileData);

    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch {
      setSubscriptionStatus(null);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const refreshSubscription = useCallback(async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch {
      // Silently fail
    }
  }, []);

  // ─── Init: resolve session once, then listen to changes ──────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const supabase = createClient();
    let cancelled = false;

    // Safety net: if everything takes too long, unblock the UI
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, INIT_TIMEOUT_MS);

    const init = async () => {
      try {
        // getSession reads from the cookie/localStorage — fast, no network.
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (cancelled) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserData();
        }
      } catch {
        // If getSession itself fails, just clear everything
        setUser(null);
        setSession(null);
        setProfile(null);
        setSubscriptionStatus(null);
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    init();

    // Listen for subsequent auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Fetch user data in background — don't block UI
        fetchUserData();
      } else {
        setProfile(null);
        setSubscriptionStatus(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // ─── Sign Out ────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscriptionStatus(null);
    // Small delay so the user sees the logout animation before redirect
    setTimeout(() => {
      window.location.href = `/${locale}/welcome`;
    }, 1200);
  }, [locale]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscriptionStatus,
        loading,
        loggingOut,
        signOut,
        refreshUserData,
        refreshSubscription,
      }}
    >
      {loggingOut && <LogoutScreen />}
      {children}
    </AuthContext.Provider>
  );
}
