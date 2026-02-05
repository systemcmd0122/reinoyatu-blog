"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Loader2, PlusCircle, CheckCircle2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { chatWithAI } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: 'user' | 'model'
  content: string
}

interface EditorChatProps {
  onApplySuggestion: (content: string, mode: 'append' | 'replace') => void
  currentContent: string
}

const EditorChat: React.FC<EditorChatProps> = ({ onApplySuggestion, currentContent }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'こんにちは！記事の執筆をお手伝いします。構成の相談や、具体的な文章の作成など、何でも聞いてください。' }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 文脈として現在の本文を含める（必要に応じて調整）
      const contextPrompt = `
現在の記事本文:
---
${currentContent}
---
ユーザーの要望: ${input}
`
      const result = await chatWithAI([...messages, { role: 'user', content: contextPrompt }])
      
      if (result.error) {
        setMessages(prev => [...prev, { role: 'model', content: `エラーが発生しました: ${result.error}` }])
      } else if (result.content) {
        setMessages(prev => [...prev, { role: 'model', content: result.content! }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "AIとの通信に失敗しました。" }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-4 border-b border-border flex items-center gap-2 bg-muted/30">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-bold">AI共同執筆アシスタント</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn(
              "flex flex-col gap-2 max-w-[90%]",
              m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-1",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {m.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                m.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted text-foreground rounded-tl-none border border-border shadow-sm"
              )}>
                {m.content}
              </div>
              
              {m.role === 'model' && i > 0 && (
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold gap-1 rounded-full"
                    onClick={() => onApplySuggestion(m.content, 'append')}
                  >
                    <PlusCircle className="h-3 w-3" />
                    末尾に追加
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold gap-1 rounded-full"
                    onClick={() => onApplySuggestion(m.content, 'replace')}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    本文を置換
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col gap-2 max-w-[90%] mr-auto items-start animate-pulse">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assistant is typing...</span>
              </div>
              <div className="bg-muted p-4 rounded-2xl rounded-tl-none border border-border flex items-center justify-center min-w-[60px]">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            placeholder="AIに相談する..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
          ※AIは本文の内容を参照して回答します
        </p>
      </div>
    </div>
  )
}

export default EditorChat
