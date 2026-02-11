"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser, getFollowStatus } from "@/actions/follow"
import { toast } from "sonner"
import { Loader2, UserPlus, UserMinus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"

interface FollowButtonProps {
  followerId: string | undefined
  followingId: string
  initialIsFollowing?: boolean
}

const FollowButton: React.FC<FollowButtonProps> = ({
  followerId,
  followingId,
  initialIsFollowing = false,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  // リアルタイム購読 (自分と相手のペアに限定)
  const lastEvent = useRealtime('user_follows', {
    event: '*',
    filter: followerId ? `follower_id=eq.${followerId}` : undefined
  })

  useEffect(() => {
    if (!lastEvent || !followerId) return
    const record = (lastEvent.new || lastEvent.old) as any
    if (record.following_id === followingId) {
      setIsFollowing(lastEvent.eventType === 'INSERT')
    }
  }, [lastEvent, followerId, followingId])

  // 初期状態をサーバーから取得（SSRで渡されない場合用）
  useEffect(() => {
    if (followerId && followerId !== followingId) {
      const fetchStatus = async () => {
        setIsLoadingStatus(true)
        const { isFollowing: status } = await getFollowStatus(followerId, followingId)
        setIsFollowing(status)
        setIsLoadingStatus(false)
      }
      fetchStatus()
    }
  }, [followerId, followingId])

  const handleFollow = async () => {
    if (!followerId) {
      toast.error("ログインが必要です")
      return
    }

    // Optimistic UI update
    const previousState = isFollowing
    setIsFollowing(!previousState)

    startTransition(async () => {
      const action = previousState ? unfollowUser : followUser
      const res = await action(followerId, followingId)

      if (!res.success) {
        // Rollback on error
        setIsFollowing(previousState)
        toast.error(res.error || "エラーが発生しました")
      } else {
        toast.success(previousState ? "フォローを解除しました" : "フォローしました")
      }
    })
  }

  if (followerId === followingId) return null

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="lg"
      loading={isPending || isLoadingStatus}
      loadingText={isFollowing ? "解除中..." : "フォロー中..."}
      onClick={handleFollow}
      className={cn(
        "rounded-2xl font-bold h-12 px-8 transition-all duration-300 min-w-[120px]",
        isFollowing 
          ? "border-2 border-primary/20 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive" 
          : "shadow-lg shadow-primary/20"
      )}
    >
      {!(isPending || isLoadingStatus) && (
        isFollowing ? (
          <span className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            フォロー中
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            フォロー
          </span>
        )
      )}
    </Button>
  )
}

export default FollowButton
