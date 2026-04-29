"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useGemma } from "@/hooks/use-gemma"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Sparkles,
  Loader2,
  ArrowLeft,
  Layout,
  Eye,
  MessageSquare,
  Wand2,
  Rocket,
  ChevronDown,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Zap,
  Smartphone,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import MarkdownRenderer from "./markdown/MarkdownRenderer"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────
interface Message {
  id: string
  role: "user" | "ai"
  content: string
}

interface BlogAICreateProps {
  userId: string
}

// ────────────────────────────────────────────
// プロンプト構築
// ────────────────────────────────────────────
const buildPrompt = (
  userMessage: string,
  conversationHistory: Message[],
  currentTitle: string,
  currentContent: string
): string => {
  const recentHistory = conversationHistory.slice(-6)
  const historyText = recentHistory
    .map((m) => `${m.role === "ai" ? "AI" : "User"}: ${m.content}`)
    .join("\n")

  const titleStatus = currentTitle
    ? `現在のタイトル: 「${currentTitle}」`
    : "タイトル: 未設定"
  const contentStatus = currentContent
    ? `本文の冒頭（参考）:\n${currentContent.substring(0, 300)}${currentContent.length > 300 ? "..." : ""}`
    : "本文: 未作成"

  return `<start_of_turn>user
必ず日本語で回答してください。あなたはプロのブログ編集者です。

【現在の記事の状況】
${titleStatus}
${contentStatus}

【これまでの会話】
${historyText}

【ユーザーの新しいメッセージ】
${userMessage}

以下のルールに従って回答してください：
- 必ず日本語で親しみやすく回答する
- 記事のタイトルを提案・更新する場合は「タイトル案：」に続けてタイトルを書く
- 記事の本文を提案・更新する場合は「本文案：」に続けてMarkdown形式で本文を書く
- 一度に全部完成させようとせず、ステップごとに進める
- 回答の最初に「指示：」などのシステム的な内容を絶対に含めない
- 自然な会話として回答する
<end_of_turn>
<start_of_turn>model
`
}

// ────────────────────────────────────────────
// AIレスポンスのパーサー
// ────────────────────────────────────────────
interface ParsedResponse {
  chatMessage: string
  newTitle: string | null
  newContent: string | null
}

const parseAIResponse = (raw: string): ParsedResponse => {
  let text = raw.trim()
  let newTitle: string | null = null
  let newContent: string | null = null

  // タイトルの抽出（複数パターン対応）
  const titlePatterns = [
    /タイトル案[：:]\s*「?(.+?)」?\s*(?:\n|$)/,
    /タイトル[：:]\s*「?(.+?)」?\s*(?:\n|$)/,
    /提案タイトル[：:]\s*「?(.+?)」?\s*(?:\n|$)/,
    /\[TITLE\]([\s\S]+?)\[\/TITLE\]/,
  ]
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) {
      const candidate = match[1].trim()
      if (candidate.length > 0 && candidate.length <= 100) {
        newTitle = candidate
        text = text.replace(match[0], "").trim()
        break
      }
    }
  }

  // 本文の抽出
  const contentPatterns = [
    /本文案[：:]\s*([\s\S]+?)(?=\n\n(?:タイトル|まず|次に|では|以上)|$)/,
    /本文[：:]\s*([\s\S]+?)(?=\n\n(?:タイトル|まず|次に|では|以上)|$)/,
    /記事の本文[：:]\s*([\s\S]+?)(?=\n\n(?:タイトル|まず|次に|では|以上)|$)/,
    /\[CONTENT\]([\s\S]+?)\[\/CONTENT\]/,
  ]
  for (const pattern of contentPatterns) {
    const match = text.match(pattern)
    if (match) {
      const candidate = match[1].trim()
      if (candidate.length >= 50) {
        newContent = candidate
        text = text.replace(match[0], "").trim()
        break
      }
    }
  }

  // システムプロンプトの残滓を除去
  const junkPatterns = [
    /^(指示|ルール|注意|システム)[：:].+$/gm,
    /<start_of_turn>[\s\S]*?<end_of_turn>/g,
    /^(User|AI|Assistant)[：:].+$/gm,
  ]
  for (const pattern of junkPatterns) {
    text = text.replace(pattern, "")
  }

  const chatMessage = text.replace(/\n{3,}/g, "\n\n").trim()
  return { chatMessage, newTitle, newContent }
}

// ────────────────────────────────────────────
// クイックアクション
// ────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "タイトルを考えて", icon: FileText },
  { label: "構成を提案して", icon: Layout },
  { label: "導入文を書いて", icon: Zap },
  { label: "もっと詳しく", icon: RefreshCw },
]

// ────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────
const BlogAICreate: React.FC<BlogAICreateProps> = ({ userId }) => {
  const router = useRouter()
  const {
    generateResponse,
    isGenerating,
    isLoading,
    downloadProgress,
    initialized,
    error: gemmaError,
  } = useGemma()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [streamingText, setStreamingText] = useState("")
  const [viewMode, setViewMode] = useState<"chat" | "preview" | "split">("split")
  const [copiedTitle, setCopiedTitle] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name: string
    avatar_url: string | null
  } | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [showMobileWarning, setShowMobileWarning] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const idCounter = useRef(0)

  const newId = () => `msg-${++idCounter.current}`

  // ── プロフィール取得 ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client")
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", userId)
          .single()
        if (data) setUserProfile(data)
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      }
    }
    fetchProfile()
  }, [userId])

  // ── 警告ダイアログの初期チェック ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ackAi = localStorage.getItem("ack_ai_demo_v1")
      if (!ackAi) {
        setShowWarning(true)
      }

      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const ackMobile = localStorage.getItem("ack_mobile_editor_v1")
      if (isMobileDevice && !ackMobile) {
        setShowMobileWarning(true)
      }
    }
  }, [])

  const handleAcceptAiWarning = () => {
    localStorage.setItem("ack_ai_demo_v1", "true")
    setShowWarning(false)
  }

  const handleAcceptMobileWarning = () => {
    localStorage.setItem("ack_mobile_editor_v1", "true")
    setShowMobileWarning(false)
  }

  // ── 初期ウェルカムメッセージ ──
  useEffect(() => {
    if (initialized && messages.length === 0) {
      setMessages([
        {
          id: newId(),
          role: "ai",
          content:
            "こんにちは！あなたの執筆パートナーです ✨\n\n今日はどんな記事を書きたいですか？テーマや書きたいことを教えていただければ、一緒に対話しながら作り上げていきましょう！\n\nたとえば「Android Studioの入門記事」「Reactの基礎を分かりやすく解説する記事」など、気軽に教えてください。",
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  // ── スクロール制御 ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isAtBottom) scrollToBottom()
  }, [messages, streamingText, isAtBottom, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current
    if (!el) return
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }, [])

  // ── テキストエリア高さ自動調整 ──
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  // ── メッセージ送信 ──
  const handleSend = useCallback(async () => {
    const userMessage = input.trim()
    if (!userMessage || isGenerating) return

    setInput("")
    const userMsgId = newId()
    const aiMsgId = newId()

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userMessage },
    ])
    setStreamingText("")

    try {
      const prompt = buildPrompt(userMessage, messages, title, content)
      let accumulatedText = ""

      const fullResponse = await generateResponse(prompt, (partial) => {
        accumulatedText = partial
        setStreamingText(partial)
      })

      const finalText = fullResponse || accumulatedText
      setStreamingText("")

      const { chatMessage, newTitle, newContent } = parseAIResponse(finalText)

      if (newTitle) {
        setTitle(newTitle)
        toast.success(`タイトルを更新: 「${newTitle}」`)
      }
      if (newContent) {
        setContent(newContent)
        toast.success("本文を更新しました")
      }

      const displayMessage =
        chatMessage ||
        (newTitle || newContent
          ? "内容を更新しました！プレビューで確認してみてください。"
          : "...")

      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "ai", content: displayMessage },
      ])
    } catch (err: any) {
      setStreamingText("")
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: "ai",
          content: `申し訳ありません、エラーが発生しました。\n\n${err?.message || "不明なエラー"}\n\nしばらく待ってから再度お試しください。`,
        },
      ])
      toast.error("送信に失敗しました")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isGenerating, messages, title, content, generateResponse])

  // ── Enter送信 / Shift+Enter改行 ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // ── クイックアクション ──
  const handleQuickAction = useCallback((label: string) => {
    setInput(label)
    textareaRef.current?.focus()
  }, [])

  // ── 完成させてエディタへ ──
  const handleFinish = useCallback(() => {
    if (!title && !content) {
      toast.error("タイトルまたは本文がありません")
      return
    }
    sessionStorage.setItem("ai_created_blog", JSON.stringify({ title, content }))
    router.push("/blog/new?from=ai")
  }, [title, content, router])

  // ── タイトルをコピー ──
  const handleCopyTitle = useCallback(async () => {
    if (!title) return
    await navigator.clipboard.writeText(title)
    setCopiedTitle(true)
    setTimeout(() => setCopiedTitle(false), 2000)
  }, [title])

  // ────────────────────────────────────────────
  // ローディング画面
  // ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 space-y-8 bg-background">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-10 w-10 text-primary" />
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            {downloadProgress
              ? "AIモデルをダウンロード中..."
              : "AI執筆パートナーを準備中..."}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {downloadProgress
              ? "初回のみ必要です。Wi-Fiでのご利用を推奨します。"
              : "AIモデルを初期化しています。少々お待ちください。"}
          </p>
        </div>

        {downloadProgress && (
          <div className="w-full max-w-sm space-y-2">
            <Progress value={downloadProgress.percentage} className="h-2 rounded-full" />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span className="text-primary font-bold animate-pulse">DOWNLOADING</span>
              <span>
                {(downloadProgress.loaded / 1024 / 1024).toFixed(0)} MB /{" "}
                {(downloadProgress.total / 1024 / 1024).toFixed(0)} MB
              </span>
              <span className="text-primary font-bold">
                {downloadProgress.percentage}%
              </span>
            </div>
          </div>
        )}

        {gemmaError && (
          <div className="max-w-sm p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center">
            <p className="font-bold mb-1">初期化に失敗しました</p>
            <p className="text-xs opacity-80">{gemmaError}</p>
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────
  // メイン UI
  // ────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-background">
      {/* AIデモ警告ダイアログ */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI機能（デモ版）利用に関するご確認
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                現在提供しているAI機能は<b>デモ版</b>です。以下の点をご了承いただいた上でご利用ください。
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>動作が不安定だったり、エラーが発生する場合があります。</li>
                <li>不正確な情報や不適切な内容を生成する可能性があります。</li>
                <li>使い勝手が悪かったり、意図しない挙動をする場合があります。</li>
              </ul>
              <p className="font-bold text-foreground">
                AIが生成した内容は必ずご自身で確認・修正した上で、自己責任でご利用ください。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.back()}>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptAiWarning}>
              承諾して利用する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* モバイル環境警告ダイアログ */}
      <AlertDialog open={!showWarning && showMobileWarning} onOpenChange={setShowMobileWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              モバイル環境でのご利用について
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                現在、スマートフォンからの執筆・編集操作は<b>最適化の途中</b>であり、画面崩れや操作のしにくさが発生する場合があります。
              </p>
              <p>
                より快適な執筆体験のためには、PC環境でのご利用を強く推奨しております。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAcceptMobileWarning}>
              了解しました
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── ヘッダー ─── */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-sm px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-primary/10 p-1 rounded-md shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-xs font-bold leading-none">AI対話型エディタ</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Gemma 2 稼働中
              </div>
            </div>
          </div>
        </div>

        {/* ビュー切替（デスクトップ） */}
        <div className="hidden sm:flex bg-muted rounded-lg p-0.5 gap-0.5">
          {(["chat", "split", "preview"] as const).map((mode) => {
            const icons = { chat: MessageSquare, split: Layout, preview: Eye }
            const labels = { chat: "チャット", split: "分割", preview: "プレビュー" }
            const Icon = icons[mode]
            return (
              <Button
                key={mode}
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="h-7 px-2.5 text-xs gap-1.5"
              >
                <Icon className="h-3 w-3" />
                <span className="hidden md:inline">{labels[mode]}</span>
              </Button>
            )
          })}
        </div>

        <Button
          size="sm"
          onClick={handleFinish}
          disabled={!title && !content}
          className="h-8 rounded-full px-3 sm:px-4 gap-1.5 font-bold text-xs shadow-sm shadow-primary/20 shrink-0"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">完成させる</span>
          <span className="sm:hidden">完成</span>
        </Button>
      </header>

      {/* ─── メインエリア ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── チャットエリア ─── */}
        {(viewMode === "chat" || viewMode === "split") && (
          <div
            className={cn(
              "flex flex-col border-r overflow-hidden",
              viewMode === "split" ? "w-full sm:w-1/2" : "w-full"
            )}
          >
            {/* メッセージ一覧 */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-2.5",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* アバター */}
                    <Avatar
                      className={cn(
                        "h-7 w-7 shrink-0 mt-0.5",
                        m.role === "ai"
                          ? "border border-primary/20 bg-primary/5"
                          : "border border-border"
                      )}
                    >
                      {m.role === "ai" ? (
                        <div className="flex items-center justify-center h-full w-full">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        </div>
                      ) : (
                        <>
                          <AvatarImage src={userProfile?.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {userProfile?.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    {/* バブル */}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        m.role === "ai"
                          ? "bg-background border border-border rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      )}
                    >
                      {m.role === "ai" ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <MarkdownRenderer content={m.content} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* ストリーミング中 */}
                {isGenerating && (
                  <motion.div
                    key="streaming"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5 border border-primary/20">
                      <div className="flex items-center justify-center h-full w-full bg-primary/5">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-3.5 w-3.5 text-primary" />
                        </motion.div>
                      </div>
                    </Avatar>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-background border border-border px-4 py-3 shadow-sm">
                      {streamingText ? (
                        <div className="text-sm leading-relaxed">
                          <p className="whitespace-pre-wrap break-words text-foreground/90">
                            {streamingText}
                          </p>
                          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-0.5">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary/40"
                              animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4],
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* スクロールダウンボタン */}
            <AnimatePresence>
              {!isAtBottom && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-28 left-1/4 -translate-x-1/2 z-10"
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={scrollToBottom}
                    className="h-8 w-8 rounded-full shadow-lg"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── 入力エリア ─── */}
            <div className="shrink-0 border-t bg-background px-3 sm:px-4 pt-3 pb-4 space-y-2.5">
              {/* クイックアクション */}
              {messages.length <= 1 && !isGenerating && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => handleQuickAction(label)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="メッセージを入力...（Enterで送信、Shift+Enterで改行）"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating}
                    rows={1}
                    className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-border bg-muted/20 focus-visible:ring-primary shadow-none py-3 pr-3 text-sm leading-relaxed placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                  className="h-11 w-11 rounded-xl shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/60">
                AIは誤った情報を生成する場合があります。内容を確認してご使用ください。
              </p>
            </div>
          </div>
        )}

        {/* ─── プレビューエリア ─── */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={cn(
              "flex flex-col overflow-hidden bg-background",
              viewMode === "preview" ? "w-full" : "hidden sm:flex w-1/2"
            )}
          >
            {/* プレビューヘッダー */}
            <div className="shrink-0 border-b px-4 py-2 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  プレビュー
                </span>
              </div>
              {title && (
                <button
                  onClick={handleCopyTitle}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedTitle ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      コピー済
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      タイトルをコピー
                    </>
                  )}
                </button>
              )}
            </div>

            {/* プレビュー本体 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-10 py-8">
              {!title && !content ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20">
                  <div className="p-5 rounded-2xl bg-muted/30">
                    <Wand2 className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-muted-foreground">
                      プレビューがここに表示されます
                    </p>
                    <p className="text-xs text-muted-foreground/50">
                      チャットで記事を作成すると自動的に反映されます
                    </p>
                  </div>
                </div>
              ) : (
                <article className="max-w-2xl mx-auto space-y-6">
                  {title && (
                    <motion.h1
                      key={title}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight"
                    >
                      {title}
                    </motion.h1>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {title && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-2 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800"
                      >
                        ✓ タイトル設定済み
                      </Badge>
                    )}
                    {content && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-2 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800"
                      >
                        ✓ 本文あり
                      </Badge>
                    )}
                  </div>

                  {content ? (
                    <motion.div
                      key={content.slice(0, 50)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none"
                    >
                      <MarkdownRenderer content={content} />
                    </motion.div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground/40">
                      <p className="text-sm italic">本文をAIと一緒に作成しましょう</p>
                    </div>
                  )}
                </article>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── モバイル：ビュー切替 ─── */}
      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1 bg-background/90 backdrop-blur border border-border rounded-full p-1 shadow-lg">
        {(["chat", "split", "preview"] as const).map((mode) => {
          const icons = { chat: MessageSquare, split: Layout, preview: Eye }
          const Icon = icons[mode]
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                viewMode === mode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BlogAICreate