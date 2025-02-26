"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toggleBookmark, getBlogBookmarkStatus } from "@/actions/bookmark"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  blogId: string
  userId: string | undefined
  initialIsBookmarked?: boolean
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  blogId, 
  userId,
  initialIsBookmarked = false
}) => {
  const [isPending, startTransition] = useTransition()
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const { isBookmarked } = await getBlogBookmarkStatus({ blogId, userId })
        setIsBookmarked(isBookmarked)
      } catch (error) {
        console.error("ブックマーク状態の取得に失敗しました", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarkStatus()
  }, [blogId, userId])

  const handleToggleBookmark = () => {
    if (!userId) {
      toast.error("ブックマークするにはログインが必要です")
      return
    }

    setIsBookmarked((prev) => !prev)

    startTransition(async () => {
      try {
        const result = await toggleBookmark({ blogId, userId })

        if (result.error) {
          // エラーが発生した場合、状態を元に戻す
          setIsBookmarked((prev) => !prev)
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
        setIsBookmarked((prev) => !prev)
        toast.error("エラーが発生しました")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "p-0 h-auto",
        isBookmarked && "text-yellow-500",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleToggleBookmark}
      disabled={isPending || isLoading || !userId}
      title={isBookmarked ? "ブックマークから削除" : "ブックマークに追加"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5",
          isBookmarked && "fill-current"
        )}
      />
    </Button>
  )
}

export default BookmarkButton