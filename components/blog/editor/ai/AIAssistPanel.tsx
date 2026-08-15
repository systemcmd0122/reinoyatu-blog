"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Editor } from "@tiptap/react"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { useWebLLM, WEBLLM_MODEL_INFO } from "@/hooks/use-webllm"
import { getAiSettings } from "@/actions/user"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AILiveStatus } from "@/components/blog/ai/AILiveStatus"
import { GPUInfoLine } from "@/components/blog/ai/GPUInfoLine"
import {
  cleanMarkdownOutput,
  markdownToNodes,
  streamMarkdownToNodes,
} from "./markdown"
import {
  Sparkles,
  X,
  Loader2,
  Square,
  RefreshCw,
  ListTree,
  AlignLeft,
  FileText,
  Cpu,
  Download,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type AIAssistAction = "continue" | "improve" | "summarize" | "headings"

interface AIAssistPanelProps {
  editor: Editor
  onClose: () => void
  initialAction?: AIAssistAction
}

interface AiSettings {
  persona?: string
  instructions?: string
  writingStyle?: string
}

interface ActionMeta {
  id: AIAssistAction
  label: string
  description: string
  icon: LucideIcon
  maxTokens?: number
}

const ACTIONS: ActionMeta[] = [
  {
    id: "continue",
    label: "続きを書く",
    description: "カーソル位置から文章を続けます",
    icon: AlignLeft,
    maxTokens: 1024,
  },
  {
    id: "improve",
    label: "文章を整える",
    description: "選択範囲（未選択時は全文）を洗練された文章に",
    icon: RefreshCw,
    maxTokens: 1024,
  },
  {
    id: "summarize",
    label: "要約する",
    description: "本文を約300文字に要約して挿入",
    icon: FileText,
    maxTokens: 512,
  },
  {
    id: "headings",
    label: "見出し案を出す",
    description: "本文に沿った見出しを3〜6個提案",
    icon: ListTree,
    maxTokens: 512,
  },
]

const MAX_PROMPT_CHARS = 4000

/**
 * [フォールバック] 生成テキストを Markdown ではなく ProseMirror ノードへ変換し、
 * ドキュメント内の追跡位置にストリーミング挿入する。
 * 通常は ./markdown の streamMarkdownToNodes / markdownToNodes を使い、
 * ここは変換に失敗した場合の最終手段。
 */
function buildContentNodes(editor: Editor, text: string): ProseMirrorNode[] {
  const schema = editor.schema
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of text.split("\n")) {
    if (line.trim() === "") {
      if (current.length) {
        blocks.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current)
  if (blocks.length === 0) return []

  return blocks.map((lines) => {
    const children: ProseMirrorNode[] = []
    lines.forEach((line, i) => {
      if (i > 0) children.push(schema.node("hardBreak"))
      children.push(schema.text(line))
    })
    return schema.node("paragraph", {}, children)
  })
}

/** [フォールバック] 生成テキスト（Markdown 形式の見出しを含む）を見出しノード列に変換する */
function buildHeadingNodes(editor: Editor, text: string): ProseMirrorNode[] {
  const schema = editor.schema
  const nodes: ProseMirrorNode[] = []
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = Math.min(match[1].length, 3) as 1 | 2 | 3
      nodes.push(
        schema.node("heading", { level }, schema.text(match[2].trim()))
      )
    } else {
      nodes.push(schema.node("paragraph", {}, schema.text(trimmed)))
    }
  }
  return nodes
}

export const AIAssistPanel: React.FC<AIAssistPanelProps> = ({
  editor,
  onClose,
  initialAction,
}) => {
  const webllm = useWebLLM()
  const [activeAction, setActiveAction] = useState<AIAssistAction | null>(initialAction ?? null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSettings, setAiSettings] = useState<AiSettings>({})

  // 挿入位置は ProseMirror のドキュメント内絶対位置で追跡し、
  // nodeSize の差分で正確に前進させる（文字数ベースだとズレるため）。
  const insertPosRef = useRef(0)
  // [追加] 挿入領域の開始位置。生成完了時にこの位置〜insertPosRef を
  // 正しくパースしたノードへ置き換える（Markdown 崩れを防ぐ確定処理）。
  const insertStartRef = useRef(0)
  const fromRef = useRef(0)
  const toRef = useRef(0)
  const firstChunkRef = useRef(true)
  const insertedCharsRef = useRef(0)
  const accumulatedRef = useRef("")
  const cancelledRef = useRef(false)
  const activeActionRef = useRef<AIAssistAction | null>(null)

  useEffect(() => {
    activeActionRef.current = activeAction
  }, [activeAction])

  // AI設定（ペルソナ / 指示 / 文体）を取得
  useEffect(() => {
    getAiSettings()
      .then((res) => {
        if (res.success) setAiSettings(res.data)
      })
      .catch(() => {})
  }, [])

  // パネルを開いた時点でモデルをバックグラウンドでプリロード
  // （進捗バーを表示しながら、初回のダウンロードを先取りする）
  useEffect(() => {
    if (webllm.webgpuSupport !== "supported") return
    if (webllm.status !== "idle") return
    webllm.loadModel().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webllm.webgpuSupport])

  const doInitialDelete = useCallback(() => {
    if (!firstChunkRef.current) return
    firstChunkRef.current = false
    const tr = editor.state.tr
    if (toRef.current > fromRef.current) {
      tr.delete(fromRef.current, toRef.current)
    }
    insertPosRef.current = fromRef.current
    editor.view.dispatch(tr)
  }, [editor])

  const insertChunk = useCallback(
    (delta: string) => {
      if (!delta) return
      doInitialDelete()
      const nodes = streamMarkdownToNodes(editor, delta)
      if (nodes.length === 0) return
      const tr = editor.state.tr
      tr.insert(insertPosRef.current, nodes)
      editor.view.dispatch(tr)
      insertPosRef.current += nodes.reduce((sum, n) => sum + n.nodeSize, 0)
      // カーソルを挿入末尾へ追従させ、ビューを自動スクロール
      const endPos = Math.min(insertPosRef.current, editor.state.doc.content.size)
      editor.commands.setTextSelection(endPos)
      editor.commands.scrollIntoView()
    },
    [editor, doInitialDelete]
  )

  const handleStreamChunk = useCallback(
    (fullText: string) => {
      // [追加] すべてのアクションで全文を積んでおき、完了時の確定パースに使う
      accumulatedRef.current = fullText
      if (activeActionRef.current === "headings") {
        // 見出し案はストリーミング中は挿入せず、完了後にノード変換して挿入する
        return
      }
      const delta = fullText.slice(insertedCharsRef.current)
      insertedCharsRef.current = fullText.length
      insertChunk(delta)
    },
    [insertChunk]
  )

  /**
   * [改善] 生成完了後に、ストリーミングで挿入した範囲を
   * 全文パースした正しい Markdown ノードへ置き換える確定処理。
   *
   * ストリーミング中の軽量変換（streamMarkdownToNodes）は途中の文字列を
   * 推測して表示するため、ヘッダーが「# 見出し」のまま残る・リストが
   * バラバラになる等の MD 崩れが起こりうる。ここでエディタと同じ
   * markdown-it パーサで全文を変換し直すことで、最終的な表示を正確にする。
   */
  const finalizeInsert = useCallback(() => {
    const text = cleanMarkdownOutput(accumulatedRef.current)
    if (!text.trim()) return

    // まだ一度も挿入していない（見出し案など）場合は選択範囲を削除してから挿入
    if (firstChunkRef.current) {
      doInitialDelete()
    }

    let nodes = markdownToNodes(editor, text)
    if (nodes.length === 0) {
      // パーサが失敗した場合のフォールバック
      nodes =
        activeActionRef.current === "headings"
          ? buildHeadingNodes(editor, text)
          : buildContentNodes(editor, text)
    }
    if (nodes.length === 0) return

    const from = insertStartRef.current
    const to = insertPosRef.current
    const tr = editor.state.tr
    if (to > from) tr.delete(from, to)
    tr.insert(insertStartRef.current, nodes)
    editor.view.dispatch(tr)

    const endPos = Math.min(
      insertStartRef.current + nodes.reduce((sum, n) => sum + n.nodeSize, 0),
      editor.state.doc.content.size
    )
    editor.commands.setTextSelection(endPos)
    editor.commands.scrollIntoView()
  }, [editor, doInitialDelete])

  const buildPrompts = useCallback(
    (action: AIAssistAction, content: string): { system: string; user: string } => {
      const ctx = [
        aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : "",
        aiSettings.instructions ? `追加の指示: ${aiSettings.instructions}` : "",
        aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : "",
      ]
        .filter(Boolean)
        .join("\n")
      const styleBlock = ctx ? `\n${ctx}\n` : ""

      const common = `
- 出力はMarkdown本文のみとし、前置き・注釈・解説・「はい、分かりました」等の挨拶は一切不要です。
- 必ず有効なMarkdown記法で出力してください（## 見出し、- 箇条書き、> 引用、**強調**、[リンク](URL)、\`\`\`コード\`\`\` など）。
- 出力全体を \`\`\` や \`\`\`markdown のコードフェンスで囲まないでください（囲むと本文にそのまま表示されてしまいます）。
- 事実が確認できない内容を断定せず、読者が読みやすい日本語で書いてください。${styleBlock}`

      switch (action) {
        case "continue":
          return {
            system: `あなたはブログ記事の執筆を支援するAIライターです。与えられた本文の「続き」を自然に書いてください。
- 既存の文体・トーン・視点を維持してください。
- 冗長にならず簡潔に、ただし内容が薄くならないように書いてください。
- 記事が長くなる場合は ## 見出しや箇条書きを適宜使って読みやすい構成にしてください。
${common}`,
            user: `以下が現在の本文です。この続きを書いてください。\n\n${content}`,
          }
        case "improve":
          return {
            system: `あなたはプロの編集者です。与えられた文章を、読者の興味を惹きつける洗練された自然な日本語の文章にブラッシュアップしてください。
- 構成と内容は維持しつつ、表現をより豊かで明確にしてください。
- 冗長な言い回しは簡潔にしてください。
- 見出し（# / ##）、箇条書き、強調など元のMarkdown構造は正しく保ってください。
- 出力は改善後のMarkdown本文のみです。${styleBlock}`,
            user: content,
          }
        case "summarize":
          return {
            system: `あなたはブログ記事の要約担当です。与えられた記事を300文字程度の丁寧な日本語で要約してください。
- 「要約:」などの接頭辞やMarkdown装飾は使わず、プレーンテキストのみを出力してください。${styleBlock}`,
            user: content,
          }
        case "headings":
          return {
            system: `あなたはブログ記事の構成プランナーです。与えられた本文に基づき、読みやすい構成の見出しを3〜6個提案してください。
- 各見出しは「## 見出しテキスト」の形式で1行に1つだけ出力してください。
- 本文の内容に沿った、具体的で読者の期待に応える見出しにしてください。
- 番号や前置き、説明は不要です。${styleBlock}`,
            user: content,
          }
      }
    },
    [aiSettings]
  )

  const runAction = useCallback(
    async (action: AIAssistAction) => {
      if (isGenerating || webllm.webgpuSupport !== "supported") return
      const fullText = editor.getText()
      if (action !== "improve" && !fullText.trim()) {
        toast.error("本文を入力してください。")
        return
      }

      // 挿入位置の決定
      const sel = editor.state.selection
      fromRef.current = sel.from
      toRef.current = sel.to
      if (action === "improve") {
        // 未選択の場合は全文を対象として置き換える
        if (sel.from === sel.to) {
          fromRef.current = 0
          toRef.current = editor.state.doc.content.size
        }
      } else {
        toRef.current = sel.from
      }

      const contentForPrompt = fullText.slice(0, MAX_PROMPT_CHARS)
      const { system, user } = buildPrompts(action, contentForPrompt)
      const messages = [
        { role: "system" as const, content: system },
        { role: "user" as const, content: user },
      ]

      setActiveAction(action)
      activeActionRef.current = action
      setIsGenerating(true)
      cancelledRef.current = false
      firstChunkRef.current = true
      insertedCharsRef.current = 0
      accumulatedRef.current = ""
      insertPosRef.current = fromRef.current
      insertStartRef.current = fromRef.current

      try {
        await webllm.generate(messages, {
          temperature: 0.7,
          maxTokens: ACTIONS.find((a) => a.id === action)?.maxTokens ?? 1024,
          onProgress: handleStreamChunk,
        })

        if (cancelledRef.current) {
          toast.info("生成を中断しました。")
          return
        }

        // [改善] ストリーミング表示を、正しくパースした Markdown ノードへ確定する
        finalizeInsert()

        editor.chain().focus().scrollIntoView().run()
        toast.success(
          action === "headings" ? "見出しを挿入しました。" : "生成して記事に反映しました。"
        )
      } catch (err: any) {
        if (cancelledRef.current) {
          toast.info("生成を中断しました。")
          return
        }
        toast.error(err?.message || "AIの生成に失敗しました。")
      } finally {
        setIsGenerating(false)
        setActiveAction(null)
        activeActionRef.current = null
      }
    },
    [
      isGenerating,
      editor,
      webllm,
      buildPrompts,
      handleStreamChunk,
      finalizeInsert,
    ]
  )

  const handleCancel = useCallback(() => {
    if (!isGenerating) return
    cancelledRef.current = true
    webllm.stop()
  }, [isGenerating, webllm])

  const webgpuAvailable = webllm.webgpuSupport === "supported"
  const showDownload = webllm.status === "downloading"

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-t-2xl md:rounded-2xl border border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl",
        "fixed bottom-0 inset-x-0 z-50 max-h-[75vh]",
        "md:absolute md:inset-auto md:top-2 md:right-2 md:w-[380px] md:max-h-[calc(100%-1rem)]"
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">AI アシスタント</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            WebGPU ローカル
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose} disabled={isGenerating}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* 実行エンジン */}
        <div className="space-y-1 p-1.5 rounded-lg bg-muted/60 text-[11px]">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-bold">WebGPU ローカル推論</span>
            <span className="ml-auto text-muted-foreground">{WEBLLM_MODEL_INFO.name}</span>
          </div>
          {/* [追加] GPU 情報・推定 VRAM・稼働状態の表示 */}
          <GPUInfoLine
            gpuInfo={webllm.gpuInfo}
            busy={isGenerating}
            vramMB={WEBLLM_MODEL_INFO.vramMB}
            className="pl-5"
          />
        </div>

        {/* WebGPU 非対応の案内 */}
        {webllm.webgpuSupport === "unsupported" && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] leading-relaxed space-y-1">
            <p className="font-bold text-amber-600 flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" />
              この端末は WebGPU 非対応です
            </p>
            <p className="text-muted-foreground">
              Chrome / Edge / その他 Chromium 系ブラウザの最新版でご利用ください。
              このブラウザでは AI アシスタントを利用できません。
            </p>
          </div>
        )}

        {/* モデルロード進捗 */}
        {showDownload && (
          <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 text-primary" />
                モデルを準備中（初回のみ）
              </span>
              <span className="text-muted-foreground">
                {Math.round(webllm.progress * 100)}%
              </span>
            </div>
            <Progress value={webllm.progress * 100} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground truncate">
              {WEBLLM_MODEL_INFO.name}（約 {WEBLLM_MODEL_INFO.downloadMB}MB / 初回のみ）をダウンロード中...
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {webllm.error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-[11px] space-y-2">
            <p className="font-bold text-destructive">WebGPU でエラーが発生しました</p>
            <p className="text-muted-foreground break-all">{webllm.error}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => webllm.loadModel().catch(() => {})}>
                <RefreshCw className="h-3 w-3 mr-1" /> 再試行
              </Button>
            </div>
          </div>
        )}

        {/* アクション一覧 */}
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            const isActive = activeAction === action.id
            return (
              <button
                key={action.id}
                type="button"
                disabled={!webgpuAvailable || isGenerating}
                onClick={() => runAction(action.id)}
                className={cn(
                  "flex flex-col items-start gap-1.5 p-2.5 rounded-lg border text-left transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs font-bold leading-tight">{action.label}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  {action.description}
                </span>
              </button>
            )
          })}
        </div>

        {/* 生成中インジケータ（[改善] 経過時間・速度・遅延案内をライブ表示） */}
        {/* status === "generating" のときだけ表示（モデルダウンロード中はダウンロード進捗を優先） */}
        {webllm.status === "generating" && (
          <div className="space-y-2">
            <AILiveStatus
              isGenerating={isGenerating}
              phase={webllm.phase}
              elapsedMs={webllm.elapsedMs}
              tps={webllm.liveTps}
              tokens={webllm.liveTokens}
            />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={handleCancel}>
                <Square className="h-3 w-3" /> 中断
              </Button>
            </div>
          </div>
        )}

        {/* 前回のパフォーマンス計測 */}
        {!isGenerating && webllm.lastTokensPerSec !== null && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              初回トークンまで <b className="text-foreground">{webllm.lastTTFT}ms</b>
            </span>
            <span>
              生成速度 <b className="text-foreground">{webllm.lastTokensPerSec} tok/s</b>
            </span>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-2.5">
          <b className="text-foreground">{WEBLLM_MODEL_INFO.name}</b> が端末上で動作します
          （{WEBLLM_MODEL_INFO.downloadMB}MB / 初回のみ、{WEBLLM_MODEL_INFO.license}）。
          記事の内容は一切サーバーに送信されません。
        </p>
      </div>
    </div>
  )
}

export default AIAssistPanel
