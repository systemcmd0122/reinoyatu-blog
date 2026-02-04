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
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from "next-themes"
import { createClient } from "@/utils/supabase/client"
import { shortcodeToEmoji } from "@/utils/emoji"
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
  useAuth()
  const { theme } = useTheme()
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentType[]>(initialComments)
  const [activeTab, setActiveTab] = useState<'newest' | 'oldest'>('newest')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

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

  // リアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel(`blog-comments-${blogId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `blog_id=eq.${blogId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new as any

            // プロフィール情報を取得
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', newComment.user_id)
              .single()
            
            const commentWithProfile = {
              ...newComment,
              content: shortcodeToEmoji(newComment.content),
              user_name: profile?.name || '不明なユーザー',
              user_avatar_url: profile?.avatar_url || null,
              reactions: []
            }
            
            setComments(prev => {
              if (prev.some(c => c.id === commentWithProfile.id)) return prev
              return [...prev, commentWithProfile]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedComment = payload.new as any
            setComments(prev => prev.map(c => 
              c.id === updatedComment.id 
                ? { ...c, content: shortcodeToEmoji(updatedComment.content), updated_at: updatedComment.updated_at }
                : c
            ))
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions'
        },
        async (payload) => {
          // リアクションが変わったコメントのIDを特定
          const reaction = (payload.new || payload.old) as any
          const commentId = reaction.comment_id
          
          // コメントのリアクションを最新状態に更新
          const { reactions } = await getCommentReactions(commentId)

          setComments(prev => {
            // 対象のコメントが現在のリストに存在するか確認
            const exists = prev.some(c => c.id === commentId)
            if (!exists) return prev

            return prev.map(c =>
              c.id === commentId ? { ...c, reactions: reactions || [] } : c
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [blogId, supabase]) // dependencyからcommentsを除去して安定化

  // コメントとリアクションの初期取得・同期
  useEffect(() => {
    const fetchCommentsAndReactions = async () => {
      try {
        let baseComments = initialComments;

        // initialCommentsがない場合のみコメント本体を取得
        if (initialComments.length === 0) {
          const { comments: fetchedComments, error } = await getBlogComments(blogId)
          if (error) {
            setError(error)
            return
          }
          baseComments = fetchedComments;
        }

        // コメントごとにリアクション情報を取得（N+1だが、現状のRPC設計に合わせる）
        // server-sideでreactionsが取得できていないため、client-sideで補完する
        const commentsWithReactions = await Promise.all(
          baseComments.map(async (comment) => {
            const { reactions } = await getCommentReactions(comment.id)
            return {
              ...comment,
              reactions: reactions || []
            }
          })
        )

        setComments(commentsWithReactions)
      } catch (error) {
        console.error("Fetch error:", error)
        setError("コメントの取得中にエラーが発生しました")
      }
    }

    fetchCommentsAndReactions()
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

      // プロフィール名の確認
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", currentUserId)
        .single()

      if (!profile?.name) {
        toast.error("プロフィール設定でユーザー名を設定してください")
        router.push("/settings/profile")
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

  const handleReactionToggle = (commentId: string, reactions: any[]) => {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, reactions } : c
    ))
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
              <PopoverContent side="top" align="end" className="w-[350px] p-0 border-none shadow-none">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme === 'dark' ? 'dark' : 'light'}
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
              onReactionToggle={handleReactionToggle}
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