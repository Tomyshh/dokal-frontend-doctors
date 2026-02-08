'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import type { SubscriptionStatus } from '@/lib/subscription';
import { getSubscriptionStatus } from '@/lib/subscription';
import api from '@/lib/api';
import { useLocale } from 'next-intl';
import { LogoutScreen } from '@/components/LogoutScreen';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  loggingOut: boolean;
  signOut: () => Promise<void>;
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
  refreshSubscription: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const supabase = createClient();
  const locale = useLocale();

  const fetchUserData = async () => {
    try {
      const { data } = await api.get<Profile>('/profile');
      setProfile(data);
    } catch {
      setProfile(null);
    }

    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch {
      setSubscriptionStatus(null);
    }
  };

  const refreshSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData();
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchUserData();
        } else {
          setProfile(null);
          setSubscriptionStatus(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscriptionStatus(null);
    // Small delay so the user sees the logout animation before redirect
    setTimeout(() => {
      window.location.href = `/${locale}/welcome`;
    }, 1200);
  };

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
        refreshSubscription,
      }}
    >
      {loggingOut && <LogoutScreen />}
      {children}
    </AuthContext.Provider>
  );
}
