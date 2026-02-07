"use client"

import React, { useState, useEffect, useTransition, useCallback } from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleBookmark, getBlogBookmarkStatus } from "@/actions/bookmark"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface BookmarkState {
  isBookmarked: boolean;
}

interface BookmarkButtonProps {
  blogId: string
  userId: string | undefined
  initialIsBookmarked?: boolean
  showLabel?: boolean
  sharedState?: BookmarkState
  onStateChange?: (state: BookmarkState) => void
  initialIsLoaded?: boolean
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  blogId, 
  userId,
  initialIsBookmarked = false,
  showLabel = false,
  sharedState,
  onStateChange,
  initialIsLoaded = false
}) => {
  const [isPending, startTransition] = useTransition()
  const [internalState, setInternalState] = useState<BookmarkState>({
    isBookmarked: initialIsBookmarked
  })
  const [isInitializing, setIsInitializing] = useState(!initialIsLoaded && !!userId)

  const isBookmarked = sharedState?.isBookmarked ?? internalState.isBookmarked

  const updateState = useCallback((newState: BookmarkState) => {
    if (onStateChange) {
      onStateChange(newState)
    } else {
      setInternalState(newState)
    }
  }, [onStateChange])

  // リアルタイム購読
  const lastEvent = useRealtime('bookmarks', {
    event: '*',
    filter: `blog_id=eq.${blogId}`
  })

  useEffect(() => {
    if (!lastEvent || !userId) return
    
    // 自分のブックマーク状態が他端末で変更された場合
    const affectedUser = (lastEvent.new || lastEvent.old) as any
    if (affectedUser.user_id === userId) {
      updateState({ isBookmarked: lastEvent.eventType === 'INSERT' })
    }
  }, [lastEvent, userId, updateState])

  useEffect(() => {
    if (initialIsLoaded || !userId) return

    let isMounted = true

    const fetchBookmarkStatus = async () => {
      try {
        const { isBookmarked } = await getBlogBookmarkStatus({ blogId, userId })
        if (isMounted) {
          updateState({ isBookmarked })
        }
      } catch (error) {
        console.error("Error fetching bookmark status:", error)
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    fetchBookmarkStatus()

    return () => {
      isMounted = false
    }
  }, [blogId, userId, initialIsLoaded, updateState])

  const handleToggleBookmark = useCallback(() => {
    if (!userId) {
      toast.error("ブックマークするにはログインが必要です")
      return
    }

    updateState({ isBookmarked: !isBookmarked })

    startTransition(async () => {
      try {
        const result = await toggleBookmark({ blogId, userId })

        if (result.error) {
          updateState({ isBookmarked: !isBookmarked })
          toast.error(result.error)
          return
        }
      } catch (error) {
        updateState({ isBookmarked: !isBookmarked })
        toast.error("エラーが発生しました")
      }
    })
  }, [blogId, userId, isBookmarked, updateState])

  if (isInitializing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-auto rounded-full"
        disabled
      >
        <Bookmark className="h-5 w-5 md:h-6 md:w-6 opacity-50" />
        {showLabel && (
          <span className="ml-2 text-sm opacity-50">読み込み中...</span>
        )}
      </Button>
    )
  }

  const buttonContent = (
    <>
      <Bookmark
        className={cn(
          "h-5 w-5 md:h-6 md:w-6 transition-all duration-200",
          isBookmarked && "fill-current"
        )}
      />
      {showLabel && (
        <span className="ml-2 text-sm">
          {isBookmarked ? "保存済み" : "ブックマーク"}
        </span>
      )}
    </>
  )

  const button = (
    <Button
      variant={showLabel ? (isBookmarked ? "secondary" : "outline") : "ghost"}
      size="sm"
      className={cn(
        showLabel ? "rounded-full px-4 py-2" : "p-3 md:p-2",
        "h-auto transition-all duration-200",
        isBookmarked && showLabel && "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
        !showLabel && isBookmarked && "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
        isPending && "opacity-70 cursor-not-allowed",
        "flex items-center"
      )}
      onClick={handleToggleBookmark}
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
          {isBookmarked ? "ブックマークから削除" : "ブックマークに追加"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default React.memo(BookmarkButton)