'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useConversations } from '@/hooks/useMessages';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import ChatWindow from '@/components/messages/ChatWindow';
import { MessageSquare } from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedConversation = conversations?.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col" padding={false}>
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-gray-700">{t('conversations')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Spinner />
            ) : !conversations?.length ? (
              <EmptyState icon={MessageSquare} title={t('noConversations')} />
            ) : (
              conversations.map((conv) => {
                const name = conv.profiles
                  ? `${conv.profiles.first_name || ''} ${conv.profiles.last_name || ''}`
                  : tc('patient');
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50',
                      selectedId === conv.id && 'bg-primary-50'
                    )}
                  >
                    <Avatar
                      src={conv.profiles?.avatar_url}
                      firstName={conv.profiles?.first_name}
                      lastName={conv.profiles?.last_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        {conv.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(conv.last_message_at, locale)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message?.content || '...'}
                        </p>
                        {conv.unread_count && conv.unread_count > 0 ? (
                          <Badge variant="default" className="ml-2 shrink-0">
                            {conv.unread_count}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedId && selectedConversation ? (
            <ChatWindow
              conversationId={selectedId}
              patientName={
                selectedConversation.profiles
                  ? `${selectedConversation.profiles.first_name || ''} ${selectedConversation.profiles.last_name || ''}`
                  : tc('patient')
              }
              patientAvatar={selectedConversation.profiles?.avatar_url}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title={t('conversations')}
                description={t('selectConversation')}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
