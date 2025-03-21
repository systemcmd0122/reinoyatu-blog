"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Loader2, MessageSquare, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { CommentType } from "@/types"
import { toast } from "sonner"
import CommentItem from "./CommentItem"
import { newComment, getBlogComments } from "@/actions/comment"
import { getCommentReactions } from "@/actions/reaction"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EmojiData {
  native: string
  id: string
  name: string
  colons: string
  skin?: number
  unified: string
}

interface CommentSectionProps {
  blogId: string
  currentUserId?: string
  initialComments?: CommentType[]
  maxNestLevel?: number
  maxVisibleReplies?: number
}

const CommentSection: React.FC<CommentSectionProps> = ({
  blogId,
  currentUserId,
  initialComments = [],
  maxNestLevel = 3,
  maxVisibleReplies = 3
}) => {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentType[]>(initialComments)
  const [activeTab, setActiveTab] = useState<'newest' | 'oldest'>('newest')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 返信をグループ化するためのマップ
  const parentComments = new Map<string, CommentType[]>()
  let topLevelComments: CommentType[] = []

  comments.forEach(comment => {
    if (comment.parent_id) {
      const replies = parentComments.get(comment.parent_id) || []
      replies.push(comment)
      parentComments.set(comment.parent_id, replies)
    } else {
      topLevelComments.push(comment)
    }
  })

  // ソート
  if (activeTab === 'newest') {
    topLevelComments = topLevelComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } else {
    topLevelComments = topLevelComments.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  // コメントの取得
  useEffect(() => {
    const fetchComments = async () => {
      if (initialComments.length === 0) {
        try {
          const { comments: fetchedComments, error } = await getBlogComments(blogId)
          if (error) {
            setError(error)
            return
          }
          
          // コメントごとにリアクション情報を取得
          const commentsWithReactions = await Promise.all(
            fetchedComments.map(async (comment: { id: string }) => {
              const { reactions } = await getCommentReactions(comment.id)
              return {
                ...comment,
                reactions: reactions || []
              }
            })
          )
          
          setComments(commentsWithReactions)
        } catch (error) {
          setError("コメントの取得中にエラーが発生しました")
        }
      }
    }

    fetchComments()
  }, [blogId, initialComments])

  // 絵文字選択時のハンドラー
  const handleEmojiSelect = (emoji: EmojiData) => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const newText = content.slice(0, start) + emoji.native + content.slice(end)
    
    setContent(newText)
    
    // カーソル位置を更新
    setTimeout(() => {
      const newPosition = start + emoji.native.length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!currentUserId) {
        toast.error("コメントを投稿するにはログインしてください")
        return
      }

      if (!content.trim()) {
        toast.error("コメントを入力してください")
        return
      }

      const res = await newComment({
        blogId,
        userId: currentUserId,
        content
      })

      if (res.error) {
        setError(res.error)
        return
      }

      if (res.comment) {
        // リアクション情報を取得
        const { reactions } = await getCommentReactions(res.comment.id)
        const commentWithReactions = {
          ...res.comment,
          reactions: reactions || []
        }
        
        setComments([...comments, commentWithReactions])
        setContent("")
        toast.success("コメントを投稿しました")
        router.refresh()
      }
    } catch (error) {
      setError("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCommentEdited = (commentId: string, newContent: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent, updated_at: new Date().toISOString() } 
          : comment
      )
    )
  }

  const handleCommentDeleted = (commentId: string) => {
    const deleteCommentAndReplies = (id: string) => {
      const childComments = parentComments.get(id) || []
      childComments.forEach(child => deleteCommentAndReplies(child.id))
      setComments(prevComments => prevComments.filter(comment => comment.id !== id))
    }
    
    deleteCommentAndReplies(commentId)
  }

  const handleReplyAdded = async (newComment: CommentType) => {
    // リアクション情報を取得
    const { reactions } = await getCommentReactions(newComment.id)
    const commentWithReactions = {
      ...newComment,
      reactions: reactions || []
    }
    
    setComments(prevComments => [...prevComments, commentWithReactions])
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          コメント
          <Badge className="ml-2">{comments.length}</Badge>
        </h2>
        
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={activeTab === 'newest' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setActiveTab('newest')}
          >
            新しい順
          </Button>
          <Button
            variant={activeTab === 'oldest' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setActiveTab('oldest')}
          >
            古い順
          </Button>
        </div>
      </div>
      
      {currentUserId ? (
        <div className="mb-6 bg-muted/30 p-4 rounded-lg">
          <label htmlFor="comment-textarea" className="text-sm font-medium mb-2 block">
            コメントを投稿
          </label>
          <div className="relative">
            <Textarea
              id="comment-textarea"
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="コメントを入力..."
              className="min-h-32 bg-background pr-10"
              onKeyDown={handleKeyPress}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-96">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              Ctrl+Enterで送信
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 送信中</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> コメントを投稿</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-muted">
          <p className="text-center">
            コメントを投稿するには
            <Button variant="link" onClick={() => router.push('/login')}>
              ログイン
            </Button>
            してください
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        {topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              blogId={blogId}
              parentComments={parentComments}
              onReplyAdded={handleReplyAdded}
              onCommentEdited={handleCommentEdited}
              onCommentDeleted={handleCommentDeleted}
              maxNestLevel={maxNestLevel}
              maxVisibleReplies={maxVisibleReplies}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10 border rounded-lg bg-muted/20">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>まだコメントはありません。最初のコメントを投稿しましょう。</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentSection