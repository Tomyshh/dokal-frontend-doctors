'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMessages, useSendMessage, useMarkConversationRead } from '@/hooks/useMessages';
import { useAuth } from '@/providers/AuthProvider';
import { useSocket } from '@/providers/SocketProvider';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import MessageBubble from './MessageBubble';
import { Send } from 'lucide-react';
import type { Message } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface ChatWindowProps {
  conversationId: string;
  patientName: string;
  patientAvatar?: string | null;
}

export default function ChatWindow({ conversationId, patientName, patientAvatar }: ChatWindowProps) {
  const t = useTranslations('messages');
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);

  // Mark as read when opening
  useEffect(() => {
    markRead.mutate();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        markRead.mutate();
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => { socket.off('message:new', handleNewMessage); };
  }, [socket, conversationId, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage.mutate(
      { content: message.trim(), message_type: 'text' },
      { onSuccess: () => setMessage('') }
    );
  };

  return (
    <Card className="h-full flex flex-col" padding={false}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar src={patientAvatar} firstName={patientName.split(' ')[0]} lastName={patientName.split(' ')[1]} size="md" />
        <div>
          <p className="text-sm font-semibold text-gray-900">{patientName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <Spinner />
        ) : (
          messages?.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('typeMessage')}
          className="flex-1 h-10 rounded-xl border border-border bg-muted/50 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <Button type="submit" size="icon" loading={sendMessage.isPending} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
