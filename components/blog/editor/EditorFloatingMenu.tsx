import React from 'react';
import { Editor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react/menus';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  Youtube,
  Sigma,
  Info,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditorFloatingMenuProps {
  editor: Editor;
}

const EditorFloatingMenu: React.FC<EditorFloatingMenuProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ 
        duration: 150,
        offset: [-44, 0],
      }}
      className="flex items-center gap-1 z-[var(--z-editor-toolbar)]"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full text-muted-foreground/60 hover:text-primary hover:bg-muted hover:scale-110 border border-border/40 bg-background/50 backdrop-blur-sm shadow-sm transition-all"
            aria-label="コンテンツを挿入"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-2 shadow-2xl rounded-xl border-border bg-background/95 backdrop-blur">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">挿入</div>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <Heading1 className="h-4 w-4" />
            </div>
            見出し 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <Heading2 className="h-4 w-4" />
            </div>
            見出し 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <List className="h-4 w-4" />
            </div>
            箇条書き
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <ListOrdered className="h-4 w-4" />
            </div>
            番号付きリスト
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <CheckSquare className="h-4 w-4" />
            </div>
            タスクリスト
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <Quote className="h-4 w-4" />
            </div>
            引用
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <Code className="h-4 w-4" />
            </div>
            コードブロック
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <TableIcon className="h-4 w-4" />
            </div>
            テーブル
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'info' }).run()} className="rounded-md">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted/50 mr-2">
              <Info className="h-4 w-4" />
            </div>
            コールアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </FloatingMenu>
  );
};

export default EditorFloatingMenu;
