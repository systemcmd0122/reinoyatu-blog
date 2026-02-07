"use client"

import React, { useState, useEffect, useTransition, useCallback } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleLike, getBlogLikeStatus } from "@/actions/like"
import { cn } from "@/lib/utils"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

interface LikeState {
  isLiked: boolean;
  likesCount: number;
}

interface LikeButtonProps {
  blogId: string
  userId: string | undefined
  initialLikesCount: number
  initialIsLiked?: boolean
  showLabel?: boolean
  sharedState?: LikeState
  onStateChange?: (state: LikeState) => void
  initialIsLoaded?: boolean
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  blogId, 
  userId, 
  initialLikesCount,
  initialIsLiked = false,
  showLabel = false,
  sharedState,
  onStateChange,
  initialIsLoaded = false
}) => {
  const [isPending, startTransition] = useTransition()
  const [internalState, setInternalState] = useState<LikeState>({
    isLiked: initialIsLiked,
    likesCount: initialLikesCount
  })
  const [isInitializing, setIsInitializing] = useState(!initialIsLoaded && !!userId)
  const [isAnimating, setIsAnimating] = useState(false)

  const isLiked = sharedState?.isLiked ?? internalState.isLiked
  const likesCount = sharedState?.likesCount ?? internalState.likesCount

  const updateState = useCallback((newState: LikeState) => {
    if (onStateChange) {
      onStateChange(newState)
    } else {
      setInternalState(newState)
    }
  }, [onStateChange])

  useEffect(() => {
    if (initialIsLoaded || !userId) return

    let isMounted = true

    const fetchLikeStatus = async () => {
      try {
        const { isLiked } = await getBlogLikeStatus({ blogId, userId })
        if (isMounted) {
          updateState({ isLiked, likesCount: initialLikesCount })
        }
      } catch (error) {
        console.error("Error fetching like status:", error)
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    fetchLikeStatus()

    return () => {
      isMounted = false
    }
  }, [blogId, userId, initialLikesCount, initialIsLoaded, updateState])

  const handleToggleLike = useCallback(() => {
    if (!userId) {
      toast.error("いいねするにはログインが必要です")
      return
    }

    const newIsLiked = !isLiked
    const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1
    
    updateState({ isLiked: newIsLiked, likesCount: newLikesCount })
    
    if (newIsLiked) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    startTransition(async () => {
      try {
        const result = await toggleLike({ blogId, userId })

        if (result.error) {
          updateState({ 
            isLiked: !newIsLiked, 
            likesCount: isLiked ? likesCount : likesCount - 1
          })
          toast.error(result.error)
          return
        }
      } catch (error) {
        updateState({ 
          isLiked: !newIsLiked, 
          likesCount: isLiked ? likesCount : likesCount - 1
        })
        toast.error("エラーが発生しました")
      }
    })
  }, [blogId, userId, isLiked, likesCount, updateState])

  if (isInitializing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-auto rounded-full"
        disabled
      >
        <Heart className="h-5 w-5 md:h-6 md:w-6 opacity-50" />
        {showLabel && (
          <span className="ml-2 text-sm opacity-50">読み込み中...</span>
        )}
      </Button>
    )
  }

  const buttonContent = (
    <>
      <Heart
        className={cn(
          "h-5 w-5 md:h-6 md:w-6 transition-all duration-200",
          isLiked && "fill-current",
          isAnimating && "scale-125"
        )}
      />
      <span className={cn(
        "text-sm ml-2",
        isAnimating && "font-bold"
      )}>
        {showLabel ? (isLiked ? "いいね済み" : "いいね") : likesCount}
      </span>
    </>
  )

  const button = (
    <Button
      variant={showLabel ? (isLiked ? "secondary" : "outline") : "ghost"}
      size="sm"
      className={cn(
        showLabel ? "rounded-full px-4 py-2" : "p-3 md:p-2",
        "h-auto transition-all duration-200",
        isLiked && showLabel && "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
        !showLabel && isLiked && "text-red-500 bg-red-50 dark:bg-red-900/20",
        isPending && "opacity-70 cursor-not-allowed",
        "flex items-center"
      )}
      onClick={handleToggleLike}
      disabled={isPending || !userId}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">処理中...</span>}
        </>
      ) : (
        buttonContent
      )}
    </Button>
  )

  return showLabel ? (
    button
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          {isLiked ? "いいねを取り消す" : "いいねする"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default React.memo(LikeButton)