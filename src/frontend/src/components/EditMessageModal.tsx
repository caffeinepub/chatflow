import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditMessage } from "../hooks/useQueries";

interface EditMessageModalProps {
  message: {
    sender: Principal;
    content: string;
    timestamp: bigint;
    isEdited: boolean;
  };
  chatId: string;
  onClose: () => void;
}

export default function EditMessageModal({
  message,
  chatId,
  onClose,
}: EditMessageModalProps) {
  const [content, setContent] = useState(message.content);
  const editMessage = useEditMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      await editMessage.mutateAsync({
        chatId,
        timestamp: message.timestamp,
        newContent: content.trim(),
      });
      toast.success("Message edited successfully");
      onClose();
    } catch (_error) {
      toast.error("Failed to edit message");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Enter your message..."
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={editMessage.isPending || !content.trim()}
            >
              {editMessage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
