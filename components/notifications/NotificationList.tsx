"use client"

import { useState, useEffect } from "react"
import { NotificationType } from "@/types"
import NotificationItem from "./NotificationItem"
import { getNotifications } from "@/actions/notification"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Loader2, BellOff, CheckCheck } from "lucide-react"

interface NotificationListProps {
  userId: string
}

const NotificationList = ({ userId }: NotificationListProps) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { markAsRead, markAllAsRead, lastNotification } = useNotifications(userId)

  // リアルタイムで新しい通知が届いた時の処理
  useEffect(() => {
    if (lastNotification) {
      const fetchActorAndAdd = async () => {
        // actor情報を取得するためにSupabaseクライアントを直接使用
        const { createClient } = await import("@/utils/supabase/client")
        const supabase = createClient()
        const { data: actorData } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', lastNotification.actor_id)
          .single()

        const fullNotification = {
          ...lastNotification,
          actor: actorData || { name: "ユーザー", avatar_url: null }
        }

        setNotifications(prev => {
          // 重複チェック
          if (prev.some(n => n.id === fullNotification.id)) return prev
          return [fullNotification as NotificationType, ...prev]
        })
      }
      fetchActorAndAdd()
    }
  }, [lastNotification])

  const fetchNotifications = async () => {
    setIsLoading(true)
    const data = await getNotifications()
    setNotifications(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">通知を読み込み中...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-muted p-6 rounded-full mb-4">
          <BellOff className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold mb-1">通知はありません</h3>
        <p className="text-muted-foreground">新しいアクティビティがあった際にお知らせします。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4 md:px-0">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
        {notifications.some(n => !n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold gap-2 hover:text-primary"
          >
            <CheckCheck className="h-4 w-4" />
            すべて既読にする
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationList
