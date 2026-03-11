import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteConversation, useGetUserProfile } from "../hooks/useQueries";

interface ConversationItemProps {
  conversation: {
    chatId: string;
    messages: Array<{
      sender: Principal;
      content: string;
      timestamp: bigint;
      isEdited: boolean;
    }>;
    groupName?: string;
    groupAvatar?: any;
  };
  isSelected: boolean;
  onSelect: () => void;
  currentUserPrincipal?: Principal;
}

export default function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const deleteConversation = useDeleteConversation();

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const isGroup = !!conversation.groupName;

  // For one-on-one chats, get the other participant
  const otherParticipant = !isGroup && lastMessage ? lastMessage.sender : null;
  const { data: otherUserProfile } = useGetUserProfile(otherParticipant);

  const displayName = isGroup
    ? conversation.groupName
    : otherUserProfile?.username || "Unknown User";

  const displayAvatar = isGroup
    ? conversation.groupAvatar?.getDirectURL()
    : otherUserProfile?.avatar?.getDirectURL();

  const unreadCount = 0; // Simplified for now

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation.mutateAsync(conversation.chatId);
      toast.success("Conversation deleted");
    } catch (_error) {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: interactive list item
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={displayAvatar} />
        <AvatarFallback className="bg-primary/10">
          {displayName?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium truncate">{displayName}</h3>
          {lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(Number(lastMessage.timestamp) / 1_000_000, {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage ? lastMessage.content : "No messages yet"}
          </p>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
