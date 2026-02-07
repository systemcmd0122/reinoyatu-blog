"use client"

import { NotificationType } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import { Heart, MessageSquare, UserPlus, Layers, AtSign, Bell, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: NotificationType
  onMarkAsRead: (id: string) => void
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />
      case 'collection_add': return <Layers className="h-4 w-4 text-purple-500" />
      case 'mention': return <AtSign className="h-4 w-4 text-amber-500" />
      case 'ai_edit': return <Sparkles className="h-4 w-4 text-primary" />
      default: return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getMessage = () => {
    const actorName = notification.actor?.name || "ユーザー"
    switch (notification.type) {
      case 'like': return `${actorName}さんがあなたの記事にいいねしました`
      case 'comment': return `${actorName}さんがあなたの記事にコメントしました`
      case 'follow': return `${actorName}さんにフォローされました`
      case 'collection_add': return `${actorName}さんがあなたの記事をコレクションに追加しました`
      case 'mention': return `${actorName}さんがあなたをメンションしました`
      case 'ai_edit': return `AI執筆アシスタントが記事の更新を提案・適用しました`
      default: return "新しい通知があります"
    }
  }

  const getLink = () => {
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        return `/blog/${notification.target_id}`
      case 'follow':
        return `/profile/${notification.actor_id}`
      case 'collection_add':
        return `/collections/${notification.target_id}`
      case 'ai_edit':
        return `/blog/${notification.target_id}/edit`
      default:
        return "#"
    }
  }

  return (
    <Link 
      href={getLink()} 
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-0",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.actor?.avatar_url || "/default.png"} />
          <AvatarFallback>{notification.actor?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border">
          {getIcon()}
        </div>
      </div>
      
      <div className="flex-1 space-y-1">
        <p className={cn(
          "text-sm leading-snug",
          !notification.is_read ? "font-bold" : "text-muted-foreground"
        )}>
          {getMessage()}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ja })}
        </p>
      </div>

      {!notification.is_read && (
        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
      )}
    </Link>
  )
}

export default NotificationItem
