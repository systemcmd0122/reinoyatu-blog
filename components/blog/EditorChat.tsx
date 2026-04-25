"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Loader2, PlusCircle, CheckCircle2, MessageSquare, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { chatWithAI } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useBroadcast } from "@/hooks/use-realtime"
import MarkdownRenderer from "./markdown/MarkdownRenderer"

interface Message {
  role: 'user' | 'model'
  content: string
}

interface EditorChatProps {
  onApplySuggestion: (content: string, mode: 'append' | 'replace') => void
  currentContent: string
}

const EditorChat: React.FC<EditorChatProps> = ({ onApplySuggestion, currentContent }) => {
  // 初期メッセージを空にして、最初のメッセージはユーザーから始まるようにする
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const isInternalUpdate = useRef(false)

  // ブロードキャストによる他タブとの同期
  const { send } = useBroadcast(`editor-chat-sync`, (payload: Message[]) => {
    // 他のタブからのメッセージを反映
    isInternalUpdate.current = true
    setMessages(prev => {
      // 内容が同じなら更新しない（無限ループ防止）
      if (JSON.stringify(prev) === JSON.stringify(payload)) return prev
      return payload
    })
  })

  // メッセージが更新されたら他タブに通知
  useEffect(() => {
    if (messages.length > 0 && !isInternalUpdate.current) {
      send(messages)
    }
    isInternalUpdate.current = false
  }, [messages, send])

  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // ウェルカムメッセージを非表示
    setShowWelcome(false)

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 文脈として現在の本文を含める
      const contextPrompt = `
あなたは優秀な執筆アシスタントです。最新の情報が必要な場合はウェブ検索を自由に行って、正確な情報に基づいて回答してください。

現在の記事本文:
---
${currentContent || '(まだ記事本文がありません)'}
---

ユーザーの要望: ${input}

上記の記事本文の内容を踏まえて、ユーザーの要望に応えてください。記事の執筆を支援する立場として、具体的で実用的な提案をしてください。
`
      const result = await chatWithAI([...messages, { role: 'user', content: contextPrompt }])
      
      if (result.error) {
        setMessages(prev => [...prev, { role: 'model', content: `エラーが発生しました: ${result.error}` }])
      } else if (result.content) {
        setMessages(prev => [...prev, { role: 'model', content: result.content! }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "AIとの通信に失敗しました。もう一度お試しください。" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border relative">
      <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl shadow-inner">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">AI共同執筆アシスタント</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">Gemini Powered Intelligence</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-10" ref={scrollRef}>
        <div className="space-y-8 pb-4">
          <AnimatePresence mode="popLayout">
            {/* ウェルカムメッセージ */}
            {showWelcome && messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-background p-5 rounded-full border border-border shadow-xl">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-black text-xl tracking-tight">AIが執筆をサポートします</h4>
                  <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mx-auto">
                    構成の相談、文章の改善、アイデア出しなど、執筆に関するあらゆるお手伝いをします。
                  </p>
                </div>

                <div className="w-full max-w-[320px] space-y-3 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left ml-1 mb-2">試してみる</p>
                  {[
                    { text: "記事の導入部分を書いてください", icon: "✍️" },
                    { text: "記事の構成案を提案してください", icon: "📋" },
                    { text: "内容をより詳しく説明してください", icon: "✨" }
                  ].map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 5, backgroundColor: "var(--primary-foreground)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInput(suggestion.text)}
                      className="w-full flex items-center justify-between p-3 text-xs font-medium bg-muted/50 border border-border rounded-xl transition-colors hover:border-primary/30"
                    >
                      <span className="flex items-center gap-2">
                        <span>{suggestion.icon}</span>
                        {suggestion.text}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* チャットメッセージ */}
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={cn(
                  "flex flex-col gap-3 max-w-[95%]",
                  m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 px-1",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "p-1 rounded-md",
                    m.role === 'user' ? "bg-muted" : "bg-primary/10"
                  )}>
                    {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-primary" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {m.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
                  </span>
                </div>

                <div className={cn(
                  "p-4 rounded-[2rem] text-sm leading-relaxed shadow-sm",
                  m.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-primary/5 text-foreground rounded-tl-none border border-primary/10"
                )}>
                  {m.role === 'model' ? (
                    <MarkdownRenderer content={m.content} className="prose-sm max-w-none" />
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
                
                {m.role === 'model' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-2 mt-1 px-1"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-bold gap-2 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={() => onApplySuggestion(m.content, 'append')}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      末尾に追加
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-bold gap-2 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={() => onApplySuggestion(m.content, 'replace')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      本文を置換
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* ローディング中の表示 */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 max-w-[95%] mr-auto items-start"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1 rounded-md bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 animate-pulse">Assistant is thinking...</span>
                </div>
                <div className="bg-primary/5 p-5 rounded-[2rem] rounded-tl-none border border-primary/10 flex items-center justify-center min-w-[80px]">
                  <div className="flex gap-1.5">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1] }}
                      className="h-1.5 w-1.5 bg-primary rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1], delay: 0.2 }}
                      className="h-1.5 w-1.5 bg-primary rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1], delay: 0.4 }}
                      className="h-1.5 w-1.5 bg-primary rounded-full" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="p-8 border-t border-border bg-background/80 backdrop-blur-md">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <Input
            placeholder="AIに相談する..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 pr-16 h-16 text-lg bg-muted/30 border-border focus-visible:ring-primary rounded-2xl shadow-inner transition-all"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className={cn(
              "absolute right-2 top-2 h-12 w-12 rounded-xl transition-all shadow-lg",
              input.trim() ? "bg-primary text-primary-foreground scale-100" : "bg-transparent text-muted-foreground scale-90"
            )}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
          </Button>
        </form>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse" />
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
            AI is ready to assist your creative process
          </p>
        </div>
      </div>
    </div>
  )
}

export default EditorChat