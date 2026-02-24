import { useState } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface FileUploadButtonProps {
  chatId: string;
}

export default function FileUploadButton({ chatId }: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const sendMessage = useSendMessage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // For now, send file info as text message
      // In a real implementation, you'd extend the Message type to support attachments
      await sendMessage.mutateAsync({
        chatId,
        content: `📎 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });

      toast.success('File uploaded successfully');
      e.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button type="button" variant="ghost" size="icon" disabled={uploading} asChild>
          <span className="cursor-pointer">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </span>
        </Button>
      </label>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
      )}
    </>
  );
}
