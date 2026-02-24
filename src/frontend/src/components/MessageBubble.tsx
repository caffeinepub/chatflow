import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Principal } from '@icp-sdk/core/principal';
import MessageActions from './MessageActions';
import { useState } from 'react';

interface MessageBubbleProps {
  message: {
    sender: Principal;
    content: string;
    timestamp: bigint;
    isEdited: boolean;
  };
  chatId: string;
}

export default function MessageBubble({ message, chatId }: MessageBubbleProps) {
  const { identity } = useInternetIdentity();
  const { data: senderProfile } = useGetUserProfile(message.sender);
  const [showActions, setShowActions] = useState(false);
  
  const isOwnMessage = identity?.getPrincipal().toString() === message.sender.toString();
  const timestamp = Number(message.timestamp) / 1_000_000;

  return (
    <div
      className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderProfile?.avatar?.getDirectURL()} />
          <AvatarFallback className="text-xs bg-primary/10">
            {senderProfile?.username.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwnMessage && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {senderProfile?.username || 'Unknown'}
          </span>
        )}
        
        <div className="relative group">
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-[oklch(0.75_0.15_145)] text-white rounded-br-sm'
                : 'bg-card border rounded-bl-sm'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'}`}>
                {format(timestamp, 'HH:mm')}
              </span>
              {message.isEdited && (
                <span className={`text-xs italic ${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'}`}>
                  edited
                </span>
              )}
            </div>
          </div>

          {isOwnMessage && showActions && (
            <div className="absolute right-0 top-0 -translate-y-full mb-1">
              <MessageActions
                message={message}
                chatId={chatId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
