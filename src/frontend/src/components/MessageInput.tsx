import { useState, useRef } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import FileUploadButton from './FileUploadButton';

interface MessageInputProps {
  chatId: string;
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        chatId,
        content: message.trim(),
      });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);
    
    setMessage(newMessage);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div className="border-t bg-card p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex gap-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <FileUploadButton chatId={chatId} />
        </div>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sendMessage.isPending}
          className="h-11 w-11 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
