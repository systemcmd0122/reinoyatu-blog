import React from 'react';
import { Editor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react/menus';
import {
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Code,
  Table as TableIcon,
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
      className="flex items-center gap-1 z-[var(--z-editor-toolbar)]"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full bg-background shadow-md hover:scale-110 transition-transform"
            aria-label="コンテンツを挿入"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4 mr-2" /> 見出し 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4 mr-2" /> 見出し 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4 mr-2" /> 箇条書き
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4 mr-2" /> 番号付きリスト
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="h-4 w-4 mr-2" /> コードブロック
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="h-4 w-4 mr-2" /> テーブル
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </FloatingMenu>
  );
};

export default EditorFloatingMenu;
