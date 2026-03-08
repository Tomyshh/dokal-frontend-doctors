'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

const INVALIDATION_KEYS = [
  ['calendar-appointments'],
  ['crm-appointments'],
  ['crm-organization-appointments'],
  ['appointment'],
] as const;

/**
 * Subscribes to Supabase Realtime on the `appointments` table.
 * When any row changes, invalidates React Query caches so the calendar
 * and appointment lists update without a page refresh.
 *
 * Prerequisites on Supabase:
 *  1. `appointments` added to the `supabase_realtime` publication
 *  2. RLS SELECT policy allowing `auth.uid()` to read their rows
 */
export function useAppointmentsRealtime() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;

    const supabase = createClient();

    // Ensure the Realtime WebSocket authenticates with the user's JWT
    // (the @supabase/ssr client may not propagate it automatically).
    supabase.realtime.setAuth(token);

    // Clean up previous channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('[Realtime] appointments change:', payload.eventType, payload);
          }
          for (const key of INVALIDATION_KEYS) {
            queryClient.invalidateQueries({ queryKey: [...key] });
          }
        }
      )
      .subscribe((status, err) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[Realtime] subscription status:', status, err ?? '');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.access_token, queryClient]);
}
