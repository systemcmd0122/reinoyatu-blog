import { useState, useEffect, useCallback } from "react"
import { useRealtime } from "./use-realtime"
import { getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notification"
import { toast } from "sonner"
import { NotificationType } from "@/types"

export function useNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  // 未読数の初期取得
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    const count = await getUnreadCount()
    setUnreadCount(count)
  }, [userId])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // リアルタイム購読
  const lastEvent = useRealtime<NotificationType>('notifications', {
    event: '*',
    filter: userId ? `user_id=eq.${userId}` : undefined
  })

  useEffect(() => {
    if (!lastEvent) return

    if (lastEvent.eventType === 'INSERT') {
      setUnreadCount(prev => prev + 1)

      // 通知の種類に応じてトーストを表示
      const notification = lastEvent.new as NotificationType
      switch (notification.type) {
        case 'follow':
          toast.info("新しいフォロワーがいます")
          break
        case 'like':
          toast.info("記事にいいねされました")
          break
        case 'comment':
          toast.info("新しいコメントがあります")
          break
        case 'mention':
          toast.success("メンションされました")
          break
        default:
          toast.info("新しい通知があります")
      }
    } else if (lastEvent.eventType === 'UPDATE') {
      const oldRead = (lastEvent.old as any)?.is_read
      const newRead = (lastEvent.new as any)?.is_read

      // 未読から既読になった場合、カウントを減らす
      if (!oldRead && newRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      // 既読から未読に戻った場合（あまりないが）、カウントを増やす
      else if (oldRead && !newRead) {
        setUnreadCount(prev => prev + 1)
      }
    } else if (lastEvent.eventType === 'DELETE') {
      const wasRead = (lastEvent.old as any)?.is_read
      if (!wasRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }, [lastEvent])

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id)
    if (res.success) {
      // カウントはRealtimeで同期されるため、ここでは何もしない
    }
    return res
  }

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead()
    if (res.success) {
      setUnreadCount(0)
    }
    return res
  }

  return {
    unreadCount,
    lastNotification: lastEvent?.eventType === 'INSERT' ? lastEvent.new : null,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh: fetchUnreadCount
  }
}
