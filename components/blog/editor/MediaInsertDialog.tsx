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
import { Image as ImageIcon, Youtube, Link as LinkIcon, Check, Upload, Library, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadImage } from '@/actions/image';
import ImageLibraryDialog from './ImageLibraryDialog';
import { toast } from 'sonner';

interface MediaInsertDialogProps {
  editor: Editor;
  userId?: string;
  type: 'image' | 'youtube' | 'table';
  isOpen: boolean;
  onClose: () => void;
}

const MediaInsertDialog: React.FC<MediaInsertDialogProps> = ({ editor, userId, type, isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [youtubeDetails, setYoutubeDetails] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadImage(base64, userId);
      if (result.error) throw new Error(result.error);

      editor.chain().focus().setImage({ src: result.data.public_url }).run();
      toast.success('画像をアップロードしました');
      onClose();
    } catch (error: any) {
      toast.error('アップロードに失敗しました: ' + error.message);
    } finally {
      setIsUploading(false);
    }
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
          {type === 'image' ? (
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">アップロード</TabsTrigger>
                <TabsTrigger value="library">ライブラリ</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="pt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="h-10"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  />
                </div>
              </TabsContent>
              <TabsContent value="upload" className="pt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl">
                <input
                  type="file"
                  id="image-upload-input"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('image-upload-input')?.click()}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  画像を選択してアップロード
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">2MB以内の JPG, PNG, WebP</p>
              </TabsContent>
              <TabsContent value="library" className="pt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl">
                <Button
                  variant="outline"
                  onClick={() => setIsLibraryOpen(true)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  ライブラリから選択
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
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
          )}

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
          <Button onClick={handleInsert} disabled={!url && type !== 'table'} className="font-bold">
            挿入する
          </Button>
        </DialogFooter>
      </DialogContent>

      {userId && (
        <ImageLibraryDialog
          userId={userId}
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelect={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
            onClose();
          }}
        />
      )}
    </Dialog>
  );
};

export default MediaInsertDialog;
