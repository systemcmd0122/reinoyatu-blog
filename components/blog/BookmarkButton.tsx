"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleBookmark, getBlogBookmarkStatus } from "@/actions/bookmark"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface BookmarkState {
  isBookmarked: boolean;
}

interface BookmarkButtonProps {
  blogId: string
  userId: string | undefined
  initialIsBookmarked?: boolean
  showLabel?: boolean
  // 共有状態の受け渡し用props
  sharedState?: BookmarkState
  onStateChange?: (state: BookmarkState) => void
  // 初期ロード状態を外部から制御するためのフラグ
  initialIsLoaded?: boolean
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  blogId, 
  userId,
  initialIsBookmarked = false,
  showLabel = false,
  // 共有状態
  sharedState,
  onStateChange,
  // 初期ロード状態
  initialIsLoaded = false
}) => {
  const [isPending, startTransition] = useTransition()
  // 内部状態またはpropsから受け取った共有状態を使用
  const [internalState, setInternalState] = useState<BookmarkState>({
    isBookmarked: initialIsBookmarked
  })
  const [isLoading, setIsLoading] = useState(!initialIsLoaded)

  // 実際に使用する状態（共有または内部）
  const isBookmarked = sharedState?.isBookmarked ?? internalState.isBookmarked

  // 状態更新関数
  const updateState = (newState: BookmarkState) => {
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
    
    const fetchBookmarkStatus = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const { isBookmarked } = await getBlogBookmarkStatus({ blogId, userId })
        // 状態の初期化
        updateState({ isBookmarked })
      } catch (error) {
        console.error("ブックマーク状態の取得に失敗しました", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarkStatus()
  }, [blogId, userId, initialIsLoaded])

  const handleToggleBookmark = () => {
    if (!userId) {
      toast.error("ブックマークするにはログインが必要です")
      return
    }

    // 状態の更新
    updateState({ isBookmarked: !isBookmarked })

    startTransition(async () => {
      try {
        const result = await toggleBookmark({ blogId, userId })

        if (result.error) {
          // エラーが発生した場合、状態を元に戻す
          updateState({ isBookmarked: !isBookmarked })
          toast.error(result.error)
          return
        }

        if (result.action === "bookmarked") {
          toast.success("ブックマークに追加しました")
        } else if (result.action === "unbookmarked") {
          toast.success("ブックマークから削除しました")
        }
      } catch (error) {
        console.error("ブックマーク処理中にエラーが発生しました", error)
        // エラーが発生した場合、状態を元に戻す
        updateState({ isBookmarked: !isBookmarked })
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
      <Bookmark
        className={cn(
          "h-5 w-5 md:h-6 md:w-6",
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

  return showLabel ? (
    <Button
      variant={isBookmarked ? "secondary" : "outline"}
      size="sm"
      className={cn(
        "rounded-full px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow",
        isBookmarked ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400" : "",
        isPending && "opacity-70 cursor-not-allowed",
        "flex items-center"
      )}
      onClick={handleToggleBookmark}
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
        <TooltipContent>
          {isBookmarked ? "ブックマークから削除" : "ブックマークに追加"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default BookmarkButton