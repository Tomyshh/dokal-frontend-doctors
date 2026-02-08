import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5',
          isMine
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-muted text-gray-900 rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isMine ? 'text-primary-100' : 'text-muted-foreground'
          )}
        >
          {format(parseISO(message.created_at), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
