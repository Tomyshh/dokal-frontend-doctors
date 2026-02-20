'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { Practitioner, Profile } from '@/types';
import {
  computeProfileCompletionPercent,
  getProfileCompletionItems,
  isPractitionerCompleteFromBackend,
} from '@/lib/practitioner';

interface PractitionerProfileContextValue {
  practitioner: Practitioner | null;
  profile: Profile | null | undefined;
  completionPercent: number;
  isComplete: boolean;
  completionItems: ReturnType<typeof getProfileCompletionItems>;
  isLoading: boolean;
}

const PractitionerProfileContext = createContext<PractitionerProfileContextValue | null>(null);

interface PractitionerProfileProviderProps {
  practitioner: Practitioner | null;
  profile: Profile | null | undefined;
  isLoading: boolean;
  children: ReactNode;
}

export function PractitionerProfileProvider({
  practitioner,
  profile,
  isLoading,
  children,
}: PractitionerProfileProviderProps) {
  const value = useMemo(() => {
    const completionPercent = computeProfileCompletionPercent(practitioner, profile);
    const completionItems = getProfileCompletionItems(practitioner, profile);
    const isComplete = isPractitionerCompleteFromBackend(practitioner);
    return {
      practitioner,
      profile,
      completionPercent,
      isComplete,
      completionItems,
      isLoading,
    };
  }, [practitioner, profile, isLoading]);

  return (
    <PractitionerProfileContext.Provider value={value}>
      {children}
    </PractitionerProfileContext.Provider>
  );
}

export function usePractitionerProfile() {
  const ctx = useContext(PractitionerProfileContext);
  return ctx;
}
