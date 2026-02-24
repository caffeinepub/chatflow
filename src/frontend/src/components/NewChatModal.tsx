import { useState } from 'react';
import { useSearchUser, useCreateChat } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useGetUserProfile } from '../hooks/useQueries';

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatModal({ onClose, onChatCreated }: NewChatModalProps) {
  const [username, setUsername] = useState('');
  const searchUser = useSearchUser();
  const createChat = useCreateChat();
  const { data: foundUserProfile } = useGetUserProfile(searchUser.data || null);

  const handleSearch = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    await searchUser.mutateAsync(username.trim());
  };

  const handleCreateChat = async () => {
    if (!searchUser.data) {
      toast.error('Please search for a user first');
      return;
    }

    try {
      const chatId = await createChat.mutateAsync({
        participants: [searchUser.data],
        isGroup: false,
        groupName: null,
        groupAvatar: null,
      });
      toast.success('Chat created successfully!');
      onChatCreated(chatId);
      onClose();
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username-search">Search by Username</Label>
            <div className="flex gap-2">
              <Input
                id="username-search"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searchUser.isPending}>
                {searchUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {searchUser.isSuccess && !searchUser.data && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">User not found</p>
            </div>
          )}

          {searchUser.data && foundUserProfile && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={foundUserProfile.avatar?.getDirectURL()} />
                  <AvatarFallback className="bg-primary/10">
                    {foundUserProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{foundUserProfile.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {foundUserProfile.status}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCreateChat}
                className="w-full"
                disabled={createChat.isPending}
              >
                {createChat.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Chat...
                  </>
                ) : (
                  'Start Chat'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
