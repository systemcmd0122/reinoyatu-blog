import React from 'react'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
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
  Minus,
  Clock,
  Activity,
  FileText,
} from 'lucide-react'
import SlashCommandList from './SlashCommandList'

export default {
  items: ({ query }: { query: string }) => {
    return [
      {
        title: '見出し 1',
        description: '大見出しを設定します',
        icon: <Heading1 className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
        },
      },
      {
        title: '見出し 2',
        description: '中見出しを設定します',
        icon: <Heading2 className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
        },
      },
      {
        title: '見出し 3',
        description: '小見出しを設定します',
        icon: <Heading3 className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
        },
      },
      {
        title: '箇条書きリスト',
        description: 'シンプルなリストを作成します',
        icon: <List className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run()
        },
      },
      {
        title: '番号付きリスト',
        description: '番号付きのリストを作成します',
        icon: <ListOrdered className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run()
        },
      },
      {
        title: 'タスクリスト',
        description: 'チェックボックス付きのリストを作成します',
        icon: <CheckSquare className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run()
        },
      },
      {
        title: '引用',
        description: '引用文を挿入します',
        icon: <Quote className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run()
        },
      },
      {
        title: 'コードブロック',
        description: 'プログラミングコードを挿入します',
        icon: <Code className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
        },
      },
      {
        title: 'テーブル',
        description: '3x3のテーブルを挿入します',
        icon: <TableIcon className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        },
      },
      {
        title: '水平線',
        description: 'セクションを分ける線を挿入します',
        icon: <Minus className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run()
        },
      },
      {
        title: '画像',
        description: '画像を挿入します',
        icon: <ImageIcon className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).run()
          // For slash commands, we need a way to trigger the dialog. 
          // Since this is a static object, we might need to emit an event or 
          // use a state from the parent. 
          // For now, let's use a simpler approach: focus the toolbar or just 
          // assume we'll implement a better event system.
          // BUT, to keep it functional and prompt-free, let's use a custom event.
          window.dispatchEvent(new CustomEvent('open-media-dialog', { detail: { type: 'image' } }));
        },
      },
      {
        title: 'YouTube',
        description: 'YouTube動画を埋め込みます',
        icon: <Youtube className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).run()
          window.dispatchEvent(new CustomEvent('open-media-dialog', { detail: { type: 'youtube' } }));
        },
      },
      {
        title: '数式',
        description: 'LaTeX形式の数式を挿入します',
        icon: <Sigma className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setMathematics({ latex: 'E = mc^2', inline: false }).run()
        },
      },
      {
        title: 'コールアウト',
        description: '補足情報を目立たせます',
        icon: <Info className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setCallout({ type: 'info' }).run()
        },
      },
      {
        title: 'アコーディオン',
        description: '折りたたみ可能なコンテンツ',
        icon: <ChevronDown className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setAccordion({ title: 'クリックして詳細を表示' }).run()
        },
      },
      {
        title: 'タイムライン',
        description: '時系列のリストを作成します',
        icon: <Clock className="h-4 w-4" />,
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).setTimeline().run()
        },
      },
    ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
  },

  render: () => {
    let component: ReactRenderer
    let popup: any

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: any) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return (component.ref as any)?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}
