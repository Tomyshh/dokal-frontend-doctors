'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Subscribes to Supabase Realtime changes on the `appointments` table.
 * On INSERT, UPDATE, or DELETE, invalidates calendar and appointments queries
 * so React Query refetches and the UI updates in real time.
 *
 * Requires: Supabase Realtime enabled on the `appointments` table
 * (see Database > Publications > supabase_realtime).
 */
export function useAppointmentsRealtime() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;

    const supabase = createClient();
    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          // Invalidate all appointment-related queries so they refetch
          queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
          queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
          queryClient.invalidateQueries({ queryKey: ['crm-organization-appointments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.access_token, queryClient]);
}
