/**
 * OneSignal Web SDK v16 - helpers pour le CRM praticien.
 * Le SDK est chargé via CDN dans le layout.
 */

declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: OneSignalSDK) => void | Promise<void>>;
    OneSignal?: OneSignalSDK;
  }
}

export interface OneSignalNotificationClickEvent {
  notification?: {
    id?: string;
    data?: Record<string, string>;
    additionalData?: Record<string, string>;
  };
  additionalData?: Record<string, string>;
}

export interface OneSignalSDK {
  init: (opts: { appId: string }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User?: {
    PushSubscription?: {
      id: string | null;
      token: string | null;
      addEventListener?: (event: string, cb: () => void) => void;
    };
  };
  Notifications?: {
    permission?: boolean;
    addEventListener?: (
      event: 'click',
      cb: (event: OneSignalNotificationClickEvent) => void
    ) => void;
    requestPermission?: () => Promise<boolean>;
  };
}

export function runWhenOneSignalReady(fn: (OneSignal: OneSignalSDK) => void | Promise<void>): void {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await fn(OneSignal);
  });
}

export function getNotificationDataFromClickEvent(
  event: OneSignalNotificationClickEvent
): { type?: string; conversation_id?: string; appointment_id?: string } | null {
  const data =
    event?.notification?.data ??
    event?.notification?.additionalData ??
    event?.additionalData;
  if (!data || typeof data !== 'object') return null;
  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    conversation_id: typeof data.conversation_id === 'string' ? data.conversation_id : undefined,
    appointment_id: typeof data.appointment_id === 'string' ? data.appointment_id : undefined,
  };
}
