"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { NotificationType } from "@/types"

/**
 * 通知一覧を取得する
 */
export async function getNotifications() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (
        name,
        avatar_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Get notifications error:", error)
    return []
  }

  return data as NotificationType[]
}

/**
 * 未読通知数を取得する
 */
export async function getUnreadCount() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Get unread count error:", error)
    return 0
  }

  return count || 0
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)

  if (error) {
    console.error("Mark as read error:", error)
    return { success: false, error: "既読処理に失敗しました" }
  }

  revalidatePath("/")
  return { success: true }
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "ログインが必要です" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Mark all as read error:", error)
    return { success: false, error: "一括既読処理に失敗しました" }
  }

  revalidatePath("/")
  return { success: true }
}
