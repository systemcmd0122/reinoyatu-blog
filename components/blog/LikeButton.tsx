"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleLike, getBlogLikeStatus } from "@/actions/like"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  // 共有状態の受け渡し用props
  sharedState?: LikeState
  onStateChange?: (state: LikeState) => void
  // 初期ロード状態を外部から制御するためのフラグ
  initialIsLoaded?: boolean
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  blogId, 
  userId, 
  initialLikesCount,
  initialIsLiked = false,
  showLabel = false,
  // 共有状態
  sharedState,
  onStateChange,
  // 初期ロード状態
  initialIsLoaded = false
}) => {
  const [isPending, startTransition] = useTransition()
  // 内部状態またはpropsから受け取った共有状態を使用
  const [internalState, setInternalState] = useState<LikeState>({
    isLiked: initialIsLiked,
    likesCount: initialLikesCount
  })
  const [isLoading, setIsLoading] = useState(!initialIsLoaded)
  const [isAnimating, setIsAnimating] = useState(false)

  // 実際に使用する状態（共有または内部）
  const isLiked = sharedState?.isLiked ?? internalState.isLiked
  const likesCount = sharedState?.likesCount ?? internalState.likesCount

  // 状態更新関数
  const updateState = (newState: LikeState) => {
    if (onStateChange) {
      // 親コンポーネントに状態を伝える
      onStateChange(newState)
    } else {
      // 親コンポーネントがない場合は内部状態を更新
      setInternalState(newState)
    }
  }

  useEffect(() => {
    // 既にロード済みの場合はスキップ
    if (initialIsLoaded) {
      return
    }
    
    const fetchLikeStatus = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const { isLiked } = await getBlogLikeStatus({ blogId, userId })
        // 状態の初期化
        updateState({ 
          isLiked, 
          likesCount: initialLikesCount 
        })
      } catch (error) {
        console.error("いいね状態の取得に失敗しました", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLikeStatus()
  }, [blogId, userId, initialLikesCount, initialIsLoaded])

  const handleToggleLike = () => {
    if (!userId) {
      toast.error("いいねするにはログインが必要です")
      return
    }

    const newIsLiked = !isLiked
    const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1
    
    // 状態の更新
    updateState({ 
      isLiked: newIsLiked, 
      likesCount: newLikesCount
    })
    
    // アニメーション効果
    if (newIsLiked) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 500)
    }

    startTransition(async () => {
      try {
        const result = await toggleLike({ blogId, userId })

        if (result.error) {
          // エラーが発生した場合、状態を元に戻す
          updateState({ 
            isLiked: !newIsLiked, 
            likesCount: isLiked ? likesCount : likesCount - 1
          })
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
        updateState({ 
          isLiked: !newIsLiked, 
          likesCount: isLiked ? likesCount : likesCount - 1
        })
        toast.error("エラーが発生しました")
      }
    })
  }

  // ローディング中の表示
  if (isLoading) {
    return showLabel ? (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-4 py-2 h-auto opacity-70 cursor-not-allowed flex items-center"
        disabled
      >
        <Loader2 className="h-5 w-5 md:h-6 md:w-6 mr-2 animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </Button>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-auto rounded-full opacity-70 cursor-not-allowed flex items-center"
        disabled
      >
        <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
      </Button>
    )
  }

  const buttonContent = (
    <>
      <Heart
        className={cn(
          "h-5 w-5 md:h-6 md:w-6 transition-transform",
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

  return showLabel ? (
    <Button
      variant={isLiked ? "secondary" : "outline"}
      size="sm"
      className={cn(
        "rounded-full px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow",
        isLiked ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" : "",
        isPending && "opacity-70 cursor-not-allowed",
        "flex items-center"
      )}
      onClick={handleToggleLike}
      disabled={isPending || !userId}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>処理中...</span>
        </>
      ) : (
        buttonContent
      )}
    </Button>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "p-2 h-auto rounded-full",
              isLiked && "text-red-500 bg-red-50 dark:bg-red-900/20",
              isPending && "opacity-70 cursor-not-allowed",
              "flex items-center space-x-1"
            )}
            onClick={handleToggleLike}
            disabled={isPending || !userId}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              buttonContent
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isLiked ? "いいねを取り消す" : "いいねする"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default LikeButton