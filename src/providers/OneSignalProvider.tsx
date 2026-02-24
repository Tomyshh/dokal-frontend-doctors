'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  runWhenOneSignalReady,
  getNotificationDataFromClickEvent,
  type OneSignalNotificationClickEvent,
} from '@/lib/onesignal';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

/**
 * Gère OneSignal pour les praticiens CRM :
 * - login(user_id) à la connexion
 * - Enregistrement du token push web
 * - logout() à la déconnexion
 * - Deep linking au clic sur une notification push
 */
export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const tokenRegisteredRef = useRef<string | null>(null);

  useEffect(() => {
    runWhenOneSignalReady(async (OneSignal) => {
      if (!user?.id || profile?.role !== 'practitioner') {
        await OneSignal.logout();
        tokenRegisteredRef.current = null;
        return;
      }

      await OneSignal.login(user.id);

      // Demander la permission push si pas encore accordée
      if (!OneSignal.Notifications?.permission) {
        OneSignal.Notifications?.requestPermission?.();
      }

      // Enregistrer le token push auprès du backend après permission
      const registerToken = async () => {
        const subId = OneSignal.User?.PushSubscription?.id;
        if (subId && tokenRegisteredRef.current !== subId) {
          try {
            await api.post('/notifications/push-tokens', {
              token: subId,
              platform: 'web',
            });
            tokenRegisteredRef.current = subId;
          } catch {
            // Silently fail — backend peut ne pas être prêt
          }
        }
      };

      // Écouter les changements de subscription (permission accordée, etc.)
      OneSignal.User?.PushSubscription?.addEventListener?.('change', registerToken);
      await registerToken();
    });
  }, [user?.id, profile?.role]);

  // Déconnexion : supprimer le token backend (si encore authentifié) puis logout OneSignal
  // Ne jamais appeler api.delete quand !user?.id : on n'est pas authentifié, l'API
  // retournerait 401 et déclencherait la redirection de l'intercepteur (boucle de refresh).
  useEffect(() => {
    if (!user?.id) {
      runWhenOneSignalReady(async (OneSignal) => {
        tokenRegisteredRef.current = null;
        await OneSignal.logout();
      });
    }
  }, [user?.id]);

  // Clic sur notification push → deep linking
  useEffect(() => {
    runWhenOneSignalReady((OneSignal) => {
      const handleClick = (event: OneSignalNotificationClickEvent) => {
        const data = getNotificationDataFromClickEvent(event);
        if (!data?.type) return;

        const base = `/${locale}`;
        let href = `${base}/notifications`;

        if (data.type === 'new_message' && data.conversation_id) {
          href = `${base}/messages/${data.conversation_id}`;
        } else if (
          (data.type === 'appointment_cancelled' || data.type === 'appointment_request') &&
          data.appointment_id
        ) {
          href = `${base}/appointments/${data.appointment_id}`;
        } else if (data.type === 'review_received') {
          href = `${base}/reviews`;
        }

        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        window.location.href = href;
      };

      OneSignal.Notifications?.addEventListener?.('click', handleClick);
    });
  }, [locale, queryClient]);

  return <>{children}</>;
}
