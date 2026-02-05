import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditorBubbleMenuProps {
  editor: Editor;
}

const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URLを入力してください:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const isYoutube = editor.isActive('youtube');

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 p-1 rounded-lg border border-border bg-background shadow-xl animate-in fade-in zoom-in-95 duration-200"
    >
      {isYoutube ? (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const showDetails = editor.getAttributes('youtube').showDetails;
              editor.chain().focus().updateAttributes('youtube', { showDetails: !showDetails }).run();
            }}
            className="h-8 px-2 text-xs font-bold gap-2"
            aria-label="詳細表示切り替え"
          >
            {editor.getAttributes('youtube').showDetails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {editor.getAttributes('youtube').showDetails ? "詳細を表示中" : "詳細を非表示"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-accent text-accent-foreground')}
              aria-label="太字"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-accent text-accent-foreground')}
              aria-label="斜体"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-accent text-accent-foreground')}
              aria-label="下線"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-accent text-accent-foreground')}
              aria-label="取り消し線"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('code') && 'bg-accent text-accent-foreground')}
              aria-label="インラインコード"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-1 w-px h-4 bg-border" />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={setLink}
              className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-accent text-accent-foreground')}
              aria-label={editor.isActive('link') ? "リンクを編集" : "リンクを挿入"}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            {editor.isActive('link') && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="リンクを解除"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <a href={editor.getAttributes('link').href} target="_blank" rel="noopener noreferrer" aria-label="リンクを開く">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </BubbleMenu>
  );
};

export default EditorBubbleMenu;
