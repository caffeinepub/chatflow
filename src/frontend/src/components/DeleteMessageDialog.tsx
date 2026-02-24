import { useState } from 'react';
import { useDeleteMessage } from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

interface DeleteMessageDialogProps {
  message: {
    sender: Principal;
    content: string;
    timestamp: bigint;
    isEdited: boolean;
  };
  chatId: string;
  onClose: () => void;
}

export default function DeleteMessageDialog({ message, chatId, onClose }: DeleteMessageDialogProps) {
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const deleteMessage = useDeleteMessage();

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync({
        chatId,
        timestamp: message.timestamp,
        deleteForEveryone,
      });
      toast.success('Message deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Message</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this message?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="delete-for-everyone"
            checked={deleteForEveryone}
            onCheckedChange={(checked) => setDeleteForEveryone(checked as boolean)}
          />
          <Label htmlFor="delete-for-everyone" className="text-sm cursor-pointer">
            Delete for everyone
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMessage.isPending}
          >
            {deleteMessage.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
