import { useState } from 'react';
import { useGetConversations, useGetCallerUserProfile } from '../hooks/useQueries';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquarePlus, Search } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewChatModal from './NewChatModal';
import CreateGroupModal from './CreateGroupModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users } from 'lucide-react';

interface ConversationListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ConversationList({ selectedChatId, onSelectChat }: ConversationListProps) {
  const { data: conversations = [], isLoading } = useGetConversations();
  const { data: userProfile } = useGetCallerUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const groupName = conv.groupName || '';
    return groupName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <div className="w-full md:w-96 border-r bg-card flex flex-col">
        <div className="p-4 space-y-3 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chats</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNewChat(true)}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  New Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  New Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.chatId}
                  conversation={conversation}
                  isSelected={selectedChatId === conversation.chatId}
                  onSelect={() => onSelectChat(conversation.chatId)}
                  currentUserPrincipal={userProfile ? undefined : undefined}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onChatCreated={onSelectChat} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onGroupCreated={onSelectChat} />}
    </>
  );
}
