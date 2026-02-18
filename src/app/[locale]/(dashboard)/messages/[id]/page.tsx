'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useConversations } from '@/hooks/useMessages';
import { Skeleton } from '@/components/ui/Skeleton';
import ChatWindow from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tc = useTranslations('common');
  const { data: conversations, isLoading } = useConversations();

  const conversation = conversations?.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Chargement">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <div className="h-[calc(100vh-220px)]">
          <div className="h-full rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={i % 3 === 0 ? 'flex justify-end' : 'flex justify-start'}>
                  <Skeleton className={i % 3 === 0 ? 'h-10 w-64 rounded-2xl' : 'h-12 w-72 rounded-2xl'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patientName = conversation?.profiles
    ? `${conversation.profiles.first_name || ''} ${conversation.profiles.last_name || ''}`
    : tc('patient');

  return (
    <div className="space-y-4">
      <Link href="/messages">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
          {tc('back')}
        </Button>
      </Link>
      <div className="h-[calc(100vh-220px)]">
        <ChatWindow
          conversationId={id}
          patientName={patientName}
          patientAvatar={conversation?.profiles?.avatar_url}
        />
      </div>
    </div>
  );
}
