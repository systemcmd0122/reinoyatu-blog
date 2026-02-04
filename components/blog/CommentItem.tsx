"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Reply, Loader2, Send, ChevronDown, ChevronUp, Smile } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CommentType, ReactionType } from "@/types"
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
import { toggleReaction } from "@/actions/reaction"
import { formatJST } from "@/utils/date"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from "next-themes"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CommentItemProps {
  comment: CommentType
  currentUserId?: string
  blogId: string
  parentComments: Map<string, CommentType[]>
  onReplyAdded: (comment: CommentType) => void
  onCommentEdited: (commentId: string, content: string) => void
  onCommentDeleted: (commentId: string) => void
  onReactionToggle?: (commentId: string, reactions: ReactionType[]) => void
  nestLevel?: number
  maxNestLevel?: number
  maxVisibleReplies?: number
}

interface EmojiData {
  native: string
  id: string
  name: string
  colons: string
  skin?: number
  unified: string
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  blogId,
  parentComments,
  onReplyAdded,
  onCommentEdited,
  onCommentDeleted,
  onReactionToggle,
  nestLevel = 0,
  maxNestLevel = 3,
  maxVisibleReplies = 3
}) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const { theme } = useTheme()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  const isEdited = comment.created_at !== comment.updated_at
  const isMyComment = currentUserId === comment.user_id
  
  const replies = parentComments.get(comment.id) || []
  const replyCount = replies.length
  const visibleReplies = showAllReplies ? replies : replies.slice(0, maxVisibleReplies)
  const hasMoreReplies = replyCount > maxVisibleReplies

  const reactions = comment.reactions || []

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
    if (isReplying && replyTextareaRef.current) {
      replyTextareaRef.current.focus()
    }
  }, [isEditing, isReplying])

  // 絵文字選択時のハンドラー
  const handleEmojiSelect = (emoji: EmojiData, isReply: boolean = false) => {
    const textarea = isReply ? replyTextareaRef.current : textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = isReply ? replyContent : editContent
    const newText = text.slice(0, start) + emoji.native + text.slice(end)
    
    if (isReply) {
      setReplyContent(newText)
    } else {
      setEditContent(newText)
    }
    
    // カーソル位置を更新
    setTimeout(() => {
      const newPosition = start + emoji.native.length
      textarea.focus()
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // リアクション処理
  const handleReaction = async (emoji: EmojiData) => {
    if (!currentUserId) {
      toast.error("リアクションするにはログインしてください")
      return
    }

    // 楽観的更新の代わりに即時反映を試みる (toggleReactionの結果を使用)
    try {
      const res = await toggleReaction({
        commentId: comment.id,
        userId: currentUserId,
        emoji: emoji.native
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.reactions && onReactionToggle) {
        onReactionToggle(comment.id, res.reactions as ReactionType[])
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    }
  }

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

  const getIndentClass = () => {
    return nestLevel > 0 ? "border-l-2 border-border pl-4 ml-2" : ""
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
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-24 pr-10"
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
                      onEmojiSelect={(emoji: EmojiData) => handleEmojiSelect(emoji, false)}
                      theme={theme === 'dark' ? 'dark' : 'light'}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
            <>
              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
              
              {/* リアクション表示部分 */}
              <div className="mt-2 flex flex-wrap gap-1">
                {reactions.map((reaction) => (
                  <Button
                    key={reaction.emoji}
                    variant={reaction.reacted ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-sm transition-all",
                      reaction.reacted 
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleReaction({ native: reaction.emoji } as EmojiData)}
                  >
                    <span className="mr-1">{reaction.emoji}</span>
                    <span className="font-medium">{reaction.count}</span>
                  </Button>
                ))}
                
                {currentUserId && (
                  <Popover
                    open={isReactionPickerOpen}
                    onOpenChange={setIsReactionPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-[350px] p-0 border-none shadow-none">
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: EmojiData) => {
                          handleReaction(emoji)
                          setIsReactionPickerOpen(false)
                        }}
                        theme={theme === 'dark' ? 'dark' : 'light'}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </>
          )}
        </div>
        
        {currentUserId && !isEditing && (
          <div className="flex items-center gap-1 self-start">
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
                  <AlertDialogContent className="bg-card text-card-foreground border">
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
                        className={buttonVariants({ variant: "destructive" })}
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
          <div className="relative">
            <Textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="返信を入力..."
              className="min-h-24 pr-10"
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
                  onEmojiSelect={(emoji: EmojiData) => handleEmojiSelect(emoji, true)}
                theme={theme === 'dark' ? 'dark' : 'light'}
                />
              </PopoverContent>
            </Popover>
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
      
      {replyCount > 0 && (
        <div className="mt-2">
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
              onReactionToggle={onReactionToggle}
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