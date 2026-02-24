import { useState } from 'react';
import { useGetConversations } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Search, X } from 'lucide-react';
import { useGetUserProfile } from '../hooks/useQueries';
import GroupSettingsModal from './GroupSettingsModal';
import { useSearchMessages } from '../hooks/useQueries';

interface ChatHeaderProps {
  chatId: string;
}

export default function ChatHeader({ chatId }: ChatHeaderProps) {
  const { data: conversations = [] } = useGetConversations();
  const conversation = conversations.find(c => c.chatId === chatId);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
  const searchMessages = useSearchMessages(chatId, searchQuery);

  const isGroup = !!conversation?.groupName;
  const lastMessage = conversation?.messages[conversation.messages.length - 1];
  const otherParticipant = !isGroup && lastMessage ? lastMessage.sender : null;
  const { data: otherUserProfile } = useGetUserProfile(otherParticipant);

  const displayName = isGroup 
    ? conversation?.groupName 
    : otherUserProfile?.username || 'Unknown User';
  
  const displayAvatar = isGroup
    ? conversation?.groupAvatar?.getDirectURL()
    : otherUserProfile?.avatar?.getDirectURL();

  if (!conversation) return null;

  return (
    <>
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-primary/10">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{displayName}</h2>
              {isGroup && (
                <p className="text-xs text-muted-foreground">Group chat</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            {isGroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="mt-3">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            {searchMessages.data && searchMessages.data.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Found {searchMessages.data.length} message(s)
              </p>
            )}
          </div>
        )}
      </div>

      {showGroupSettings && isGroup && (
        <GroupSettingsModal
          chatId={chatId}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </>
  );
}
