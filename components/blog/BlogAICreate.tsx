"use client"

import React, { useState, useEffect, useRef } from "react"
import { useGemma } from "@/hooks/use-gemma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Send,
  Sparkles,
  Loader2,
  ArrowLeft,
  Layout,
  Eye,
  MessageSquare,
  Wand2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Rocket
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import MarkdownRenderer from "./markdown/MarkdownRenderer"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: "user" | "ai"
  content: string
}

interface BlogAICreateProps {
  userId: string
}

const BlogAICreate: React.FC<BlogAICreateProps> = ({ userId }) => {
  const router = useRouter()
  const gemma = useGemma()
  const { generateResponse, isGenerating, isLoading, downloadProgress, initialized } = gemma

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [viewMode, setViewMode] = useState<"chat" | "preview" | "split">("split")
  const [isFinishing, setIsFinishing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; avatar_url: string | null } | null>(null)

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
        if (data) {
          setUserProfile(data)
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      }
    }
    fetchProfile()
  }, [userId])

  // 初期メッセージ
  useEffect(() => {
    if (initialized && messages.length === 0) {
      setMessages([
        {
          role: "ai",
          content: "こんにちは！あなたの執筆パートナーです。今日はどんな記事を書きたいですか？テーマや書きたいことを教えていただければ、一緒に対話しながら作り上げていきましょう！"
        }
      ])
    }
  }, [initialized, messages.length])

  // メッセージ追加時にスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    try {
      // プロンプトの構築
      const chatContext = messages.map(m => `${m.role === "ai" ? "AI" : "ユーザー"}: ${m.content}`).join("\n")
      const prompt = `
あなたは優秀で親しみやすい編集者です。ユーザーと対話しながら、一つのブログ記事を完成させることが目的です。

現在の会話状況:
${chatContext}

ユーザーの新しいメッセージ:
${userMessage}

現在の記事の状態:
タイトル: ${title || "未設定"}
本文: ${content || "未設定"}

指示:
1. ユーザーの意図を汲み取り、親身に返答してください。
2. 記事の内容（タイトルや構成、本文の草案）を適宜提案してください。
3. 記事の更新がある場合は、必ず以下の特別なタグで囲って出力に含めてください。
   [TITLE]ここに新しいタイトル[/TITLE]
   [CONTENT]ここに新しいMarkdown形式の本文[/CONTENT]
4. 一度にすべてを完成させようとせず、ステップバイステップでユーザーに質問を投げかけながら進めてください。
5. 返答は親しみやすい日本語で行ってください。
`

      let aiResponse = ""
      const fullResponse = await generateResponse(prompt, (partial) => {
        // ストリーミング中の表示（オプション）
      })
      aiResponse = fullResponse

      // [TITLE] と [CONTENT] を抽出
      const titleMatch = aiResponse.match(/\[TITLE\](.*?)\[\/TITLE\]/s)
      const contentMatch = aiResponse.match(/\[CONTENT\](.*?)\[\/CONTENT\]/s)

      if (titleMatch) {
        setTitle(titleMatch[1].trim())
        aiResponse = aiResponse.replace(/\[TITLE\].*?\[\/TITLE\]/gs, "").trim()
      }
      if (contentMatch) {
        setContent(contentMatch[1].trim())
        aiResponse = aiResponse.replace(/\[CONTENT\].*?\[\/CONTENT\]/gs, "").trim()
      }

      setMessages(prev => [...prev, { role: "ai", content: aiResponse || "記事の内容を更新しました。" }])
    } catch (err) {
      toast.error("メッセージの送信に失敗しました。")
      console.error(err)
    }
  }

  const handleFinish = () => {
    setIsFinishing(true)
    // セッションストレージに一時保存してエディタに渡す
    sessionStorage.setItem("ai_created_blog", JSON.stringify({ title, content }))
    router.push("/blog/new?from=ai")
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">AI執筆パートナーを準備中...</h2>
          <p className="text-sm text-muted-foreground">初回のみ、モデルデータのロードに時間がかかる場合があります。</p>
        </div>
        {downloadProgress && (
          <div className="w-full max-w-md space-y-2">
            <Progress value={downloadProgress.percentage} className="h-2" />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>DOWNLOADING MODEL DATA</span>
              <span>{downloadProgress.percentage}%</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-background">
      {/* ヘッダー */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">AI対話型エディタ</h1>
              <p className="text-[10px] text-muted-foreground mt-1">Gemma 2 が執筆をサポートします</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "chat" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chat")}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              チャット
            </Button>
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <Layout className="h-3.5 w-3.5" />
              分割
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              プレビュー
            </Button>
          </div>

          <Button
            size="sm"
            className="rounded-full px-4 gap-2 font-bold shadow-lg shadow-primary/20"
            onClick={handleFinish}
            disabled={!title && !content}
          >
            <Rocket className="h-4 w-4" />
            完成させる
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* チャットエリア */}
        {(viewMode === "chat" || viewMode === "split") && (
          <div className={cn(
            "flex flex-col border-r bg-muted/5 transition-all duration-300",
            viewMode === "chat" ? "w-full" : "w-1/2"
          )}>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-6 max-w-2xl mx-auto py-4">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className={cn(
                        "h-8 w-8 shrink-0",
                        m.role === "ai" ? "border border-primary/20 bg-primary/5" : "border border-border"
                      )}>
                        {m.role === "ai" ? (
                          <div className="flex items-center justify-center h-full w-full bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <AvatarImage src={userProfile?.avatar_url || ""} />
                        )}
                        <AvatarFallback>{m.role === "ai" ? "AI" : "U"}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                        m.role === "ai"
                          ? "bg-background border border-border rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <Avatar className="h-8 w-8 border border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-center h-full w-full bg-primary/10">
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        </div>
                      </Avatar>
                      <div className="bg-background border border-border rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                        </span>
                        <span className="text-xs text-muted-foreground font-medium italic">思考中...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* 入力エリア */}
            <div className="p-4 bg-background border-t">
              <div className="max-w-2xl mx-auto relative">
                <Input
                  placeholder="メッセージを入力..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isGenerating}
                  className="pr-12 h-12 rounded-xl border-border bg-muted/20 focus-visible:ring-primary shadow-none"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 italic">
                AIは間違った情報を生成することがあります。内容を確認して使用してください。
              </p>
            </div>
          </div>
        )}

        {/* プレビューエリア */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={cn(
            "flex flex-col overflow-y-auto custom-scrollbar bg-background transition-all duration-300",
            viewMode === "preview" ? "w-full" : "w-1/2"
          )}>
            <div className="max-w-3xl mx-auto w-full p-8 md:p-12">
              {!title && !content ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="p-4 rounded-2xl bg-muted/30">
                    <Wand2 className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">記事のプレビューがここに表示されます</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">チャットを始めて、記事を一緒に作りましょう</p>
                  </div>
                </div>
              ) : (
                <article className="space-y-8">
                  {title && (
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                      {title}
                    </h1>
                  )}
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <div className="p-12 border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground/40">
                      <p className="text-sm italic font-medium">本文の案を生成中...</p>
                    </div>
                  )}
                </article>
              )}
            </div>
          </div>
        )}
      </div>

      {/* モバイル表示切替（画面幅が小さい時のみ表示） */}
      <div className="sm:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-50">
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-2xl"
          onClick={() => setViewMode(viewMode === "chat" ? "preview" : "chat")}
        >
          {viewMode === "chat" ? <Eye className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  )
}

export default BlogAICreate
