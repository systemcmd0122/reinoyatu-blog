"use client"

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
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
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'

import { Mathematics } from './extensions/Mathematics'
import { Footnote } from './extensions/Footnote'
import { Callout } from './extensions/Callout'
import { Accordion } from './extensions/Accordion'
import { Timeline, TimelineItem } from './extensions/Timeline'
import { ProgressBar } from './extensions/ProgressBar'
import { CustomYoutube } from './extensions/CustomYoutube'

import EditorToolbar from './EditorToolbar'
import EditorBubbleMenu from './EditorBubbleMenu'
import EditorFloatingMenu from './EditorFloatingMenu'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (markdown: string, json?: string) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  initialJson?: string
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
        class: 'prose prose-xl dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-8 md:p-12',
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
    <div className="rich-text-editor flex flex-col border border-border rounded-2xl bg-background shadow-sm">
      <EditorToolbar editor={editor} />
      <div className="flex-1 relative">
        <EditorBubbleMenu editor={editor} />
        <EditorFloatingMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})

RichTextEditor.displayName = "RichTextEditor"

export default RichTextEditor
