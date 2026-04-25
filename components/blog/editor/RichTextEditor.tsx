"use client"

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Typography } from '@tiptap/extension-typography'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Mention } from '@tiptap/extension-mention'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { uploadImage } from '@/actions/image'
import { toast } from 'sonner'

import { Mathematics } from './extensions/Mathematics'
import { FocusMode } from './extensions/FocusMode'
import { SlashCommand } from './extensions/SlashCommand'
import suggestion from './suggestion'
import mentionSuggestion from './mentionSuggestion'
import { Footnote } from './extensions/Footnote'
import { Callout } from './extensions/Callout'
import { Accordion } from './extensions/Accordion'
import { Timeline, TimelineItem } from './extensions/Timeline'
import { ProgressBar } from './extensions/ProgressBar'
import { CustomYoutube } from './extensions/CustomYoutube'
import { Iframe } from './extensions/Iframe'

import EditorToolbar from './EditorToolbar'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Plus,
  Type,
  Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (markdown: string, json?: string) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  initialJson?: string
  userId?: string
}

export interface RichTextEditorRef {
  getEditor: () => Editor | null
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  initialJson,
  userId,
}, ref) => {
  const [isReady, setIsReady] = useState(false)


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `見出し ${node.attrs.level}`
          }
          return placeholder || "文章を入力するか、'/' を入力してコマンドを選択..."
        },
      }),
      CharacterCount,
      SlashCommand.configure({
        suggestion,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: mentionSuggestion,
      }),
      FocusMode,
      Mathematics,
      Footnote,
      Callout,
      Accordion,
      Timeline,
      TimelineItem,
      ProgressBar,
      CustomYoutube.configure({
        width: 640,
        height: 480,
      }),
      Iframe,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
      }),
    ],
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
      const json = JSON.stringify(editor.getJSON())
      onChange(markdown, json)
    },
    onFocus,
    onBlur,
    editorProps: {
      attributes: {
        class: 'prose max-w-[850px] mx-auto focus:outline-none min-h-[1056px] py-12 px-8 md:px-20 md:py-24 bg-white dark:bg-zinc-900 shadow-2xl my-8 mb-20 rounded-sm border border-border/50 !text-foreground/90 prose-p:!text-foreground/85 prose-h1:!text-foreground prose-h2:!text-foreground prose-h3:!text-foreground prose-h4:!text-foreground prose-h5:!text-foreground prose-h6:!text-foreground prose-strong:!text-foreground prose-strong:!font-semibold prose-em:!text-foreground prose-li:!text-foreground/85 prose-td:!text-foreground/85 prose-th:!text-foreground/85 prose-a:!text-blue-500 selection:bg-primary/20',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const files = items
          .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
          .map(item => item.getAsFile())
          .filter((file): file is File => file !== null);

        if (files.length > 0) {
          event.preventDefault();

          if (!userId) {
            toast.error('画像のアップロードにはログインが必要です');
            return true;
          }

          files.forEach(async (file) => {
            const maxFileSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxFileSize) {
              toast.error(`画像サイズは2MB以下にしてください (${file.name})`);
              return;
            }

            const toastId = toast.loading(`${file.name}をアップロード中...`);

            try {
              const reader = new FileReader();
              const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });

              const result = await uploadImage(base64);
              if (!result.success) throw new Error(result.error);

              editor?.chain().focus().setImage({ src: result.data.public_url }).run();
              toast.success(`${file.name}をアップロードしました`, { id: toastId });
            } catch (error: any) {
              console.error('Upload error:', error);
              toast.error(`アップロードに失敗しました: ${file.name}`, { id: toastId });
            }
          });
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
          if (files.length > 0) {
            event.preventDefault();

            if (!userId) {
              toast.error('画像のアップロードにはログインが必要です');
              return true;
            }

            files.forEach(async (file) => {
              const maxFileSize = 2 * 1024 * 1024; // 2MB
              if (file.size > maxFileSize) {
                toast.error(`画像サイズは2MB以下にしてください (${file.name})`);
                return;
              }

              const toastId = toast.loading(`${file.name}をアップロード中...`);

              try {
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve, reject) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });

                const result = await uploadImage(base64);
                if (!result.success) throw new Error(result.error);

                editor?.chain().focus().setImage({ src: result.data.public_url }).run();
                toast.success(`${file.name}をアップロードしました`, { id: toastId });
              } catch (error: any) {
                console.error('Upload error:', error);
                toast.error(`アップロードに失敗しました: ${file.name}`, { id: toastId });
              }
            });
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  })

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }))

  // 初期値のセット
  useEffect(() => {
    if (editor && !isReady) {
      if (initialJson && initialJson !== "{}") {
        try {
          editor.commands.setContent(JSON.parse(initialJson), false as any)
        } catch (e) {
          editor.commands.setContent(content, false as any)
        }
      } else {
        editor.commands.setContent(content, false as any)
      }
      setIsReady(true)
    }
  }, [editor, isReady, initialJson, content])

  useEffect(() => {
    if (editor && isReady && content !== (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()) {
      if (!editor.isFocused) {
        editor.commands.setContent(content, false as any)
      }
    }
  }, [content, editor, isReady])

  if (!editor) {
    return null
  }

  return (
    <div className="rich-text-editor flex flex-col bg-muted/30 h-full overflow-hidden">
      <div className="hidden md:block shadow-sm z-10">
        <EditorToolbar editor={editor} userId={userId} />
      </div>

      <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-muted/10">
        {editor && (
          <>
            <BubbleMenu editor={editor} className="flex items-center gap-1 p-1 bg-background border border-border rounded-lg shadow-xl backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-accent' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-accent' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'bg-accent' : ''}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleLink({ href: '' }).run()}
                className={editor.isActive('link') ? 'bg-accent' : ''}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-accent' : ''}
              >
                <Code className="h-4 w-4" />
              </Button>
            </BubbleMenu>

          </>
        )}
        <div className="max-w-full overflow-x-hidden pb-32">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="block md:hidden border-t border-border bg-background pb-[env(safe-area-inset-bottom)] z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <EditorToolbar editor={editor} userId={userId} />
      </div>
    </div>
  )
})

RichTextEditor.displayName = "RichTextEditor"

export default RichTextEditor
