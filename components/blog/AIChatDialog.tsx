"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User, Send, Eraser } from "lucide-react"
import { cn } from '@/lib/utils'
import { generateChatResponse } from '@/utils/gemini'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyContent: (content: string) => void
  currentContent: string
  title: string
}

export function AIChatDialog({
  open,
  onOpenChange,
  onApplyContent,
  currentContent,
  title
}: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && messages.length === 0) {
      // 初期メッセージを設定
      setMessages([
        {
          role: 'assistant',
          content: `こんにちは！"${title}"の記事作成をサポートします。\n\n現在の記事内容をベースに、一緒に改善や新しいアイデアを考えていきましょう。\n\n以下のような質問ができます：\n- この部分をより詳しく説明するには？\n- この内容に追加すべき重要な点は？\n- この説明をより分かりやすくするには？\n- 技術的な正確性を確認したい\n- 構成の改善案が欲しい`
        }
      ])
    }
  }, [open, title, messages.length])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await generateChatResponse(
        input,
        messages,
        currentContent,
        title
      )

      if (response.error) {
        throw new Error(response.error)
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.content || '' }
      ])
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "しばらく時間をおいて再度お試しください",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([{
      role: 'assistant',
      content: `こんにちは！"${title}"の記事作成をサポートします。\n\n現在の記事内容をベースに、一緒に改善や新しいアイデアを考えていきましょう。\n\n以下のような質問ができます：\n- この部分をより詳しく説明するには？\n- この内容に追加すべき重要な点は？\n- この説明をより分かりやすくするには？\n- 技術的な正確性を確認したい\n- 構成の改善案が欲しい`
    }])
  }

  const handleApplyLastResponse = () => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    if (assistantMessages.length > 0) {
      const lastResponse = assistantMessages[assistantMessages.length - 1].content
      onApplyContent(lastResponse)
      toast({
        title: "内容を適用しました",
        description: "エディタの内容が更新されました"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AIアシスタントとチャット</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end space-x-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-xs"
          >
            <Eraser className="h-4 w-4 mr-1" />
            クリア
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleApplyLastResponse}
            className="text-xs"
            disabled={!messages.some(m => m.role === 'assistant')}
          >
            最後の回答を適用
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4 border rounded-md" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start space-x-2 p-2 rounded-lg",
                  message.role === 'assistant' ? 'bg-muted' : 'bg-accent'
                )}
              >
                {message.role === 'assistant' ? (
                  <Bot className="h-6 w-6 mt-1" />
                ) : (
                  <User className="h-6 w-6 mt-1" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-pulse">応答を生成中...</div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1"
              rows={3}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}