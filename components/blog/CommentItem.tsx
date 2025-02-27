"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Reply, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CommentType } from "@/types"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { editComment, deleteComment, newComment } from "@/actions/comment"
import { formatJST } from "@/utils/date"

interface CommentItemProps {
  comment: CommentType
  currentUserId?: string
  blogId: string
  parentComments: Map<string, CommentType[]>
  onReplyAdded: (comment: CommentType) => void
  onCommentEdited: (commentId: string, content: string) => void
  onCommentDeleted: (commentId: string) => void
  nestLevel?: number
  maxNestLevel?: number
  maxVisibleReplies?: number
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  blogId,
  parentComments,
  onReplyAdded,
  onCommentEdited,
  onCommentDeleted,
  nestLevel = 0,
  maxNestLevel = 3, // 最大ネストレベル
  maxVisibleReplies = 3 // 初期表示する返信の最大数
}) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  const isEdited = comment.created_at !== comment.updated_at
  const isMyComment = currentUserId === comment.user_id
  
  const replies = parentComments.get(comment.id) || []
  const replyCount = replies.length
  const visibleReplies = showAllReplies ? replies : replies.slice(0, maxVisibleReplies)
  const hasMoreReplies = replyCount > maxVisibleReplies

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
    if (isReplying && replyTextareaRef.current) {
      replyTextareaRef.current.focus()
    }
  }, [isEditing, isReplying])

  const handleEdit = async () => {
    setIsLoading(true)
    try {
      if (!currentUserId) {
        toast.error("ログインしてください")
        return
      }

      const res = await editComment({
        commentId: comment.id,
        userId: currentUserId,
        content: editContent
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      onCommentEdited(comment.id, editContent)
      toast.success("コメントを編集しました")
      setIsEditing(false)
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleteLoading(true)
    try {
      if (!currentUserId) {
        toast.error("ログインしてください")
        return
      }

      const res = await deleteComment({
        commentId: comment.id,
        userId: currentUserId
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      onCommentDeleted(comment.id)
      toast.success("コメントを削除しました")
      router.refresh()
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const handleReply = async () => {
    setIsLoading(true)
    try {
      if (!currentUserId) {
        toast.error("ログインしてください")
        return
      }

      if (!replyContent.trim()) {
        toast.error("コメントを入力してください")
        return
      }

      const res = await newComment({
        blogId,
        userId: currentUserId,
        content: replyContent,
        parentId: comment.id
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.comment) {
        onReplyAdded(res.comment)
        toast.success("返信しました")
        setReplyContent("")
        setIsReplying(false)
        router.refresh()
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // 返信のインデントクラスを計算
  const getIndentClass = () => {
    return nestLevel > 0 ? "border-l-2 border-gray-200 pl-4 ml-2" : "";
  }

  return (
    <div className={`relative ${getIndentClass()} ${nestLevel > 0 ? "mt-3" : "mt-4"}`}>
      <div className="flex items-start gap-2 bg-background p-3 rounded-lg shadow-sm">
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={comment.user_avatar_url || "/noImage.png"} 
            alt={comment.user_name}
          />
          <AvatarFallback>
            {comment.user_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 break-words">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user_name}</span>
            <Badge variant="outline" className="text-xs font-normal">
              {formatJST(comment.created_at)}
              {isEdited && " (編集済み)"}
            </Badge>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-24"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 更新中</>
                  ) : (
                    "更新"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>
        
        {currentUserId && !isEditing && (
          <div className="flex items-center gap-1 self-start">
            {/* ネスティングが最大レベル未満の場合のみ返信ボタンを表示 */}
            {nestLevel < maxNestLevel && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7" 
                onClick={() => setIsReplying(!isReplying)}
                aria-label="返信"
              >
                <Reply className="h-4 w-4" />
              </Button>
            )}
            
            {isMyComment && (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7" 
                  onClick={() => setIsEditing(true)}
                  aria-label="編集"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-destructive" 
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>コメントを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={isDeleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleteLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 削除中</>
                      ) : (
                        "削除"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>
      
      {isReplying && (
        <div className="mt-3 ml-4">
          <div className="flex items-start gap-2">
            <Textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="返信を入力..."
              className="min-h-24"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm" 
              onClick={() => setIsReplying(false)}
            >
              キャンセル
            </Button>
            <Button 
              size="sm" 
              onClick={handleReply}
              disabled={isLoading || !replyContent.trim()}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 送信中</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> 返信</>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* 返信表示 */}
      {replyCount > 0 && (
        <div className="mt-2">
          {/* 返信が多い場合に表示/非表示の切り替えボタンを表示 */}
          {hasMoreReplies && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs mb-2 ml-2"
              onClick={() => setShowAllReplies(!showAllReplies)}
            >
              {showAllReplies ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  返信を折りたたむ ({replyCount})
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  すべての返信を表示 ({replyCount})
                </>
              )}
            </Button>
          )}
          
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              blogId={blogId}
              parentComments={parentComments}
              onReplyAdded={onReplyAdded}
              onCommentEdited={onCommentEdited}
              onCommentDeleted={onCommentDeleted}
              nestLevel={nestLevel + 1}
              maxNestLevel={maxNestLevel}
              maxVisibleReplies={maxVisibleReplies}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem