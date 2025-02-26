"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { CommentType } from "@/types"
import { toast } from "sonner"
import CommentItem from "./CommentItem"
import { newComment, getBlogComments } from "@/actions/comment"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CommentSectionProps {
  blogId: string
  currentUserId?: string
  initialComments?: CommentType[]
}

const CommentSection: React.FC<CommentSectionProps> = ({
  blogId,
  currentUserId,
  initialComments = []
}) => {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentType[]>(initialComments)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 返信をグループ化するためのマップ
  const parentComments = new Map<string, CommentType[]>()
  const topLevelComments: CommentType[] = []

  comments.forEach(comment => {
    if (comment.parent_id) {
      const replies = parentComments.get(comment.parent_id) || []
      replies.push(comment)
      parentComments.set(comment.parent_id, replies)
    } else {
      topLevelComments.push(comment)
    }
  })

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
          setComments(fetchedComments)
        } catch (error) {
          setError("コメントの取得中にエラーが発生しました")
        }
      }
    }

    fetchComments()
  }, [blogId, initialComments])

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
        // 新しいコメントを追加
        setComments([...comments, res.comment])
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
    // Ctrl+Enterでコメント送信
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
    // 削除対象のコメントとその返信を全て削除
    const deleteCommentAndReplies = (id: string) => {
      const childComments = parentComments.get(id) || []
      // 再帰的に子コメントも削除
      childComments.forEach(child => deleteCommentAndReplies(child.id))
      setComments(prevComments => prevComments.filter(comment => comment.id !== id))
    }
    
    deleteCommentAndReplies(commentId)
  }

  const handleReplyAdded = (newComment: CommentType) => {
    setComments(prevComments => [...prevComments, newComment])
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">コメント</h2>
      
      {currentUserId ? (
        <div className="mb-6">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="コメントを入力..."
            className="min-h-32"
            onKeyDown={handleKeyPress}
          />
          <div className="flex justify-end mt-2">
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
          <p className="text-xs text-muted-foreground mt-1">
            Ctrl+Enterで送信
          </p>
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
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-6">
            まだコメントはありません。最初のコメントを投稿しましょう。
          </p>
        )}
      </div>
    </div>
  )
}

export default CommentSection