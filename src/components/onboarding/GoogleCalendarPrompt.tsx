'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Calendar, ArrowRightLeft, Clock, X } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useStartGoogleCalendarConnect } from '@/hooks/useGoogleCalendarIntegration';

const STORAGE_KEY = 'dokal-gcal-prompt-dismissed';

interface GoogleCalendarPromptProps {
  open: boolean;
  onDismiss: () => void;
}

export default function GoogleCalendarPrompt({ open, onDismiss }: GoogleCalendarPromptProps) {
  const connectMutation = useStartGoogleCalendarConnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const result = await connectMutation.mutateAsync();
      if (result.auth_url) {
        window.location.href = result.auth_url;
      }
    } catch {
      setConnecting(false);
    }
  }, [connectMutation]);

  const handleDismiss = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* SSR guard */ }
    onDismiss();
  }, [onDismiss]);

  return (
    <Dialog open={open} onClose={handleDismiss} className="max-w-md overflow-hidden">
      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-8 pt-10 pb-6 text-center">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-100/50 ring-1 ring-black/[0.04]">
            <Image
              src="/logo/google_logo.png"
              alt="Google Calendar"
              width={44}
              height={44}
              className="h-11 w-11"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Synchronisez votre agenda
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            Connectez Google Calendar pour centraliser tous vos rendez-vous en un seul endroit.
          </p>
        </div>

        {/* Features */}
        <div className="px-8 py-5 space-y-3">
          <Feature
            icon={<ArrowRightLeft className="h-4 w-4 text-blue-500" />}
            text="Synchronisation bidirectionnelle en temps réel"
          />
          <Feature
            icon={<Calendar className="h-4 w-4 text-emerald-500" />}
            text="Vos événements Google apparaissent dans Dokal"
          />
          <Feature
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            text="Évitez les conflits et les doubles réservations"
          />
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-2 space-y-3">
          <Button
            onClick={handleConnect}
            loading={connecting}
            className="w-full h-12 text-base gap-2.5 rounded-xl shadow-md shadow-primary/20"
          >
            <Image
              src="/logo/google_logo.png"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
              aria-hidden
            />
            Connecter Google Calendar
          </Button>
          <button
            onClick={handleDismiss}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Plus tard
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-black/[0.04]">
        {icon}
      </div>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
