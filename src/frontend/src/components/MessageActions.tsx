import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Principal } from "@icp-sdk/core/principal";
import { Edit2, Trash2 } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useDeleteMessage, useEditMessage } from "../hooks/useQueries";
import DeleteMessageDialog from "./DeleteMessageDialog";
import EditMessageModal from "./EditMessageModal";

interface MessageActionsProps {
  message: {
    sender: Principal;
    content: string;
    timestamp: bigint;
    isEdited: boolean;
  };
  chatId: string;
}

export default function MessageActions({
  message,
  chatId,
}: MessageActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fiveMinutesInNanos = BigInt(5 * 60 * 1_000_000_000);
  const currentTime = BigInt(Date.now() * 1_000_000);
  const isWithinEditWindow =
    currentTime - message.timestamp <= fiveMinutesInNanos;

  if (!isWithinEditWindow) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEditModal && (
        <EditMessageModal
          message={message}
          chatId={chatId}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteMessageDialog
          message={message}
          chatId={chatId}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}
