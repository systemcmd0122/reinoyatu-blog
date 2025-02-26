"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleLike, getBlogLikeStatus } from "@/actions/like"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  blogId: string
  userId: string | undefined
  initialLikesCount: number
  initialIsLiked?: boolean
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  blogId, 
  userId, 
  initialLikesCount,
  initialIsLiked = false
}) => {
  const [isPending, startTransition] = useTransition()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const { isLiked } = await getBlogLikeStatus({ blogId, userId })
        setIsLiked(isLiked)
      } catch (error) {
        console.error("いいね状態の取得に失敗しました", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLikeStatus()
  }, [blogId, userId])

  const handleToggleLike = () => {
    if (!userId) {
      toast.error("いいねするにはログインが必要です")
      return
    }

    setIsLiked((prev) => !prev)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))

    startTransition(async () => {
      try {
        const result = await toggleLike({ blogId, userId })

        if (result.error) {
          // エラーが発生した場合、状態を元に戻す
          setIsLiked((prev) => !prev)
          setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1))
          toast.error(result.error)
          return
        }

        if (result.action === "liked") {
          toast.success("いいねしました")
        } else if (result.action === "unliked") {
          toast.success("いいねを取り消しました")
        }
      } catch (error) {
        console.error("いいね処理中にエラーが発生しました", error)
        // エラーが発生した場合、状態を元に戻す
        setIsLiked((prev) => !prev)
        setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1))
        toast.error("エラーが発生しました")
      }
    })
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "p-0 h-auto",
          isLiked && "text-red-500",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleToggleLike}
        disabled={isPending || isLoading || !userId}
      >
        <Heart
          className={cn(
            "h-5 w-5",
            isLiked && "fill-current"
          )}
        />
      </Button>
      <span className="text-sm">{likesCount}</span>
    </div>
  )
}

export default LikeButton