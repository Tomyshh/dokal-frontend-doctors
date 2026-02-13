'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useConversations } from '@/hooks/useMessages';
import { Spinner } from '@/components/ui/Spinner';
import ChatWindow from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tc = useTranslations('common');
  const { data: conversations, isLoading } = useConversations();

  const conversation = conversations?.find((c) => c.id === id);

  if (isLoading) return <Spinner size="lg" />;

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
