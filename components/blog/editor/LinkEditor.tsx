import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, Unlink, ExternalLink, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkEditorProps {
  editor: Editor;
  children: React.ReactNode;
}

const LinkEditor: React.FC<LinkEditorProps> = ({ editor, children }) => {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const attrs = editor.getAttributes('link');
      setUrl(attrs.href || '');
    }
  }, [isOpen, editor]);

  const applyLink = () => {
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setIsOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 shadow-2xl rounded-xl border-border bg-background/95 backdrop-blur animate-in fade-in zoom-in-95" side="top" align="center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">リンクを設定</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            <Button size="sm" onClick={applyLink} className="h-9 px-3">
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {editor.isActive('link') && (
            <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={removeLink}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              >
                <Unlink className="h-3 w-3" />
                解除
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-2"
              >
                <a href={editor.getAttributes('link').href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  開く
                </a>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LinkEditor;
