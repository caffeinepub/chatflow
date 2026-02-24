import { useState } from 'react';
import { useSearchUser, useCreateChat, useGetUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { ExternalBlob } from '../backend';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [username, setUsername] = useState('');
  const [members, setMembers] = useState<Principal[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const searchUser = useSearchUser();
  const createChat = useCreateChat();
  const { data: foundUserProfile } = useGetUserProfile(searchUser.data || null);

  const handleSearch = async () => {
    if (!username.trim()) return;
    await searchUser.mutateAsync(username.trim());
  };

  const handleAddMember = () => {
    if (!searchUser.data) return;
    if (members.some(m => m.toString() === searchUser.data!.toString())) {
      toast.error('User already added');
      return;
    }
    setMembers([...members, searchUser.data]);
    setUsername('');
    searchUser.reset();
  };

  const handleRemoveMember = (principal: Principal) => {
    setMembers(members.filter(m => m.toString() !== principal.toString()));
  };

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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (members.length === 0) {
      toast.error('Please add at least one member');
      return;
    }

    try {
      let avatarBlob: ExternalBlob | null = null;
      
      if (avatarFile) {
        const arrayBuffer = await avatarFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        avatarBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      const chatId = await createChat.mutateAsync({
        participants: members,
        isGroup: true,
        groupName: groupName.trim(),
        groupAvatar: avatarBlob,
      });
      
      toast.success('Group created successfully!');
      onGroupCreated(chatId);
      onClose();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
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
                htmlFor="group-avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-3 w-3" />
                <input
                  id="group-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searchUser.isPending} size="icon">
                {searchUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {searchUser.data && foundUserProfile && (
            <div className="border rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={foundUserProfile.avatar?.getDirectURL()} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {foundUserProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{foundUserProfile.username}</span>
              </div>
              <Button onClick={handleAddMember} size="sm">Add</Button>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Members ({members.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => (
                  <MemberItem
                    key={member.toString()}
                    principal={member}
                    onRemove={() => handleRemoveMember(member)}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleCreateGroup}
            className="w-full"
            disabled={createChat.isPending || !groupName.trim() || members.length === 0}
          >
            {createChat.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Group...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberItem({ principal, onRemove }: { principal: Principal; onRemove: () => void }) {
  const { data: profile } = useGetUserProfile(principal);

  return (
    <div className="flex items-center justify-between p-2 border rounded-lg">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar?.getDirectURL()} />
          <AvatarFallback className="text-xs bg-primary/10">
            {profile?.username.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{profile?.username || 'Loading...'}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
