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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Baseline,
  Highlighter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LinkEditor from './LinkEditor';

interface EditorBubbleMenuProps {
  editor: Editor;
}

const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  if (!editor) return null;


  const isYoutube = editor.isActive('youtube');

  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#a855f7' },
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 200,
        animation: 'shift-away',
      }}
      className={cn(
        "flex items-center gap-0.5 p-1 rounded-xl border border-border bg-background/95 backdrop-blur shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[var(--z-editor-toolbar)]",
        isMobile && "max-w-[90vw] overflow-x-auto no-scrollbar"
      )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" aria-label="テキスト形式">
                  <Type className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className={cn(editor.isActive('paragraph') && 'bg-accent')}>
                  段落
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}>
                  見出し 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}>
                  見出し 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn(editor.isActive('heading', { level: 3 }) && 'bg-accent')}>
                  見出し 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="mx-1 w-px h-4 bg-border" />

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="文字色">
                  <Baseline className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="grid grid-cols-3 gap-1">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      className="w-full h-8 rounded border border-border"
                      style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value }}
                      onClick={() => editor.chain().focus().setColor(c.value).run()}
                      title={c.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="背景色">
                  <Highlighter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="grid grid-cols-3 gap-1">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      className="w-full h-8 rounded border border-border"
                      style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value }}
                      onClick={() => editor.chain().focus().setHighlight({ color: c.value }).run()}
                      title={c.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mx-1 w-px h-4 bg-border" />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
              aria-label="左揃え"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
              aria-label="中央揃え"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
              aria-label="右揃え"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-1 w-px h-4 bg-border" />

          <div className="flex items-center gap-0.5">
            <LinkEditor editor={editor}>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-accent text-accent-foreground')}
                aria-label={editor.isActive('link') ? "リンクを編集" : "リンクを挿入"}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </LinkEditor>
          </div>
        </>
      )}
    </BubbleMenu>
  );
};

export default EditorBubbleMenu;
