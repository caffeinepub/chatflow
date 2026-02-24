import { useState, useEffect } from 'react';
import { useGetConversations, useUpdateGroupSettings, useAddGroupMember, useRemoveGroupMember, useAssignGroupAdmin, useSearchUser, useGetUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Search, Shield, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GroupSettingsModalProps {
  chatId: string;
  onClose: () => void;
}

export default function GroupSettingsModal({ chatId, onClose }: GroupSettingsModalProps) {
  const { data: conversations = [] } = useGetConversations();
  const conversation = conversations.find(c => c.chatId === chatId);
  
  const [groupName, setGroupName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');

  const updateSettings = useUpdateGroupSettings();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const assignAdmin = useAssignGroupAdmin();
  const searchUser = useSearchUser();

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.groupName || '');
      if (conversation.groupAvatar) {
        setAvatarPreview(conversation.groupAvatar.getDirectURL());
      }
    }
  }, [conversation]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSettings = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      let avatarBlob: ExternalBlob | null = conversation?.groupAvatar || null;
      
      if (avatarFile) {
        const arrayBuffer = await avatarFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        avatarBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      await updateSettings.mutateAsync({
        chatId,
        groupName: groupName.trim(),
        groupAvatar: avatarBlob,
      });

      toast.success('Group settings updated');
    } catch (error) {
      toast.error('Failed to update group settings');
    }
  };

  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    await searchUser.mutateAsync(searchUsername.trim());
  };

  const handleAddMember = async () => {
    if (!searchUser.data) return;
    try {
      await addMember.mutateAsync({
        chatId,
        newMember: searchUser.data,
      });
      toast.success('Member added successfully');
      setSearchUsername('');
      searchUser.reset();
      setShowAddMember(false);
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  if (!conversation) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-xl bg-primary/10">
                  {groupName.charAt(0).toUpperCase() || 'G'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="group-avatar-edit"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="group-avatar-edit"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group-name-edit">Group Name</Label>
            <Input
              id="group-name-edit"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          <Button
            onClick={handleUpdateSettings}
            className="w-full"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Settings'
            )}
          </Button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Members</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMember(!showAddMember)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>

            {showAddMember && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search username..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={searchUser.isPending} size="icon">
                    {searchUser.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {searchUser.data && (
                  <Button onClick={handleAddMember} className="w-full" size="sm">
                    Add User
                  </Button>
                )}
              </div>
            )}

            <ScrollArea className="h-48 border rounded-lg p-2">
              <div className="space-y-2">
                {/* Note: In a real implementation, you'd fetch the actual participants list */}
                <p className="text-sm text-muted-foreground text-center py-4">
                  Member management available
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
