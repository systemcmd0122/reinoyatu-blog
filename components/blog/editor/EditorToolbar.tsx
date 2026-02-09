import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Youtube,
  Sigma,
  Info,
  ChevronDown,
  Minus,
  Clock,
  Activity,
  Type,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import MediaInsertDialog from './MediaInsertDialog';
import LinkEditor from './LinkEditor';

interface EditorToolbarProps {
  editor: Editor;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaDialog, setMediaDialog] = useState<{ type: 'image' | 'youtube' | 'table', isOpen: boolean }>({
    type: 'image',
    isOpen: false,
  });

  useEffect(() => {
    const handleOpenMedia = (e: any) => {
      setMediaDialog({ type: e.detail.type, isOpen: true });
    };
    window.addEventListener('open-media-dialog', handleOpenMedia);
    return () => window.removeEventListener('open-media-dialog', handleOpenMedia);
  }, []);

  if (!editor) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        editor.chain().focus().setImage({ src: result }).run();
      };
      reader.readAsDataURL(file);
    }
  };


  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#a855f7' },
  ];

  return (
    <div className="flex items-center md:flex-wrap gap-1 py-2 border-b border-border/50 bg-background/50 sticky top-0 z-[var(--z-editor-toolbar)] backdrop-blur-sm overflow-x-auto no-scrollbar md:overflow-x-visible transition-all">
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0"
          aria-label="元に戻す"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0"
          aria-label="やり直し"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 md:h-10 md:h-8 gap-1 px-2" aria-label="テキスト形式">
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

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('bold') && 'bg-accent text-accent-foreground')}
          aria-label="太字"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('italic') && 'bg-accent text-accent-foreground')}
          aria-label="斜体"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('underline') && 'bg-accent text-accent-foreground')}
          aria-label="下線"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('strike') && 'bg-accent text-accent-foreground')}
          aria-label="取り消し線"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('code') && 'bg-accent text-accent-foreground')}
          aria-label="インラインコード"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0" aria-label="文字色">
              <Baseline className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="grid grid-cols-3 gap-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  className="w-full h-10 md:h-8 rounded border border-border"
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
            <Button variant="ghost" size="sm" className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0" aria-label="背景色">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="grid grid-cols-3 gap-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  className="w-full h-10 md:h-8 rounded border border-border"
                  style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value }}
                  onClick={() => editor.chain().focus().setHighlight({ color: c.value }).run()}
                  title={c.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('bulletList') && 'bg-accent text-accent-foreground')}
          aria-label="箇条書きリスト"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('orderedList') && 'bg-accent text-accent-foreground')}
          aria-label="番号付きリスト"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('taskList') && 'bg-accent text-accent-foreground')}
          aria-label="タスクリスト"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0" aria-label="画像挿入">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setMediaDialog({ type: 'image', isOpen: true })}>
              URLから挿入
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              アップロード
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
        <LinkEditor editor={editor}>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive('link') && 'bg-accent')}
            aria-label="リンク挿入"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </LinkEditor>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setMediaDialog({ type: 'youtube', isOpen: true })}
          className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0"
          aria-label="YouTube埋め込み"
        >
          <Youtube className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 w-10 md:h-10 md:h-8 md:w-10 md:w-8 p-0" disabled={!editor.isActive('table')} aria-label="テーブル操作">
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>列を前に追加</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>列を後に追加</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>列を削除</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>行を上に追加</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>行を下に追加</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>行を削除</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>テーブルを削除</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
          aria-label="左揃え"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
          aria-label="中央揃え"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn('h-10 md:h-8 w-10 md:w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
          aria-label="右揃え"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 md:h-10 md:h-8 gap-1 px-2">
            詳細
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4 mr-2" /> 引用
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="h-4 w-4 mr-2" /> コードブロック
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4 mr-2" /> 水平線
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="h-4 w-4 mr-2" /> テーブル挿入
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().setMathematics({ latex: 'E = mc^2', inline: true }).run()}>
            <Sigma className="h-4 w-4 mr-2" /> 数式 (インライン)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setMathematics({ latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', inline: false }).run()}>
            <Sigma className="h-4 w-4 mr-2" /> 数式 (ブロック)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setFootnote({ label: '1', content: 'ここに注釈を入力' }).run()}>
            <FileText className="h-4 w-4 mr-2" /> 脚注挿入
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'info' }).run()}>
            <Info className="h-4 w-4 mr-2" /> コールアウト (情報)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setAccordion({ title: 'クリックして詳細を表示' }).run()}>
            <ChevronDown className="h-4 w-4 mr-2" /> アコーディオン
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTimeline().run()}>
            <Clock className="h-4 w-4 mr-2" /> タイムライン
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setProgressBar({ value: 75, label: '進捗', color: 'primary' }).run()}>
            <Activity className="h-4 w-4 mr-2" /> プログレスバー
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MediaInsertDialog
        editor={editor}
        type={mediaDialog.type}
        isOpen={mediaDialog.isOpen}
        onClose={() => setMediaDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EditorToolbar;
