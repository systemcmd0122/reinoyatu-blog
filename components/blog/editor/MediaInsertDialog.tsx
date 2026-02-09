import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Youtube, Link as LinkIcon, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaInsertDialogProps {
  editor: Editor;
  type: 'image' | 'youtube' | 'table';
  isOpen: boolean;
  onClose: () => void;
}

const MediaInsertDialog: React.FC<MediaInsertDialogProps> = ({ editor, type, isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [youtubeDetails, setYoutubeDetails] = useState(true);

  const handleInsert = () => {
    if (!url && type !== 'table') return;

    if (type === 'image') {
      editor.chain().focus().setImage({ src: url }).run();
    } else if (type === 'youtube') {
      editor.commands.setYoutubeVideo({ src: url });
      editor.chain().focus().updateAttributes('youtube', { showDetails: youtubeDetails }).run();
    }

    setUrl('');
    onClose();
  };

  const getTitle = () => {
    if (type === 'image') return '画像を挿入';
    if (type === 'youtube') return 'YouTube動画を埋め込み';
    return 'コンテンツを挿入';
  };

  const getIcon = () => {
    if (type === 'image') return <ImageIcon className="h-5 w-5 mr-2 text-primary" />;
    if (type === 'youtube') return <Youtube className="h-5 w-5 mr-2 text-red-500" />;
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/image.jpg'}
              className="h-10"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>

          {type === 'youtube' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-sm font-medium">動画詳細を表示する</span>
              <Button
                variant={youtubeDetails ? "default" : "outline"}
                size="sm"
                onClick={() => setYoutubeDetails(!youtubeDetails)}
                className="h-8"
              >
                {youtubeDetails ? "ON" : "OFF"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleInsert} disabled={!url} className="font-bold">
            挿入する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaInsertDialog;
