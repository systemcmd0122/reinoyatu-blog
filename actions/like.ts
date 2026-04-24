"use server"

import { createClient } from "@/utils/supabase/server"
import { createNotification } from "./notification"

interface ToggleLikeProps {
  blogId: string
  userId: string
}

// いいねの切り替え（追加/削除）
export const toggleLike = async ({ blogId, userId }: ToggleLikeProps) => {
  try {
    if (!blogId) return { error: "blogId is required", action: null }
    if (!userId) return { error: "userId is required", action: null }
    const supabase = createClient()

    // RLS (Row Level Security) を使用して、一度の操作で切り替えを実行
    const { data, error } = await supabase.rpc('toggle_like', {
      p_blog_id: blogId,
      p_user_id: userId
    })

    if (error) {
      console.error('Toggle like error:', error)
      return { error: error.message, action: null }
    }

    // いいねされた場合、記事の投稿者に通知を送信
    if (data === true) { // toggle_like RPC returns true if liked, false if unliked
      // 記事の投稿者IDを取得
      const { data: blogData } = await supabase
        .from("blogs")
        .select("user_id")
        .eq("id", blogId)
        .single()

      if (blogData) {
        await createNotification({
          userId: blogData.user_id,
          actorId: userId,
          type: 'like',
          targetId: blogId,
          targetType: 'blog'
        })
      }
    }

    // データベース関数から返された action を使用
    return { error: null, action: data ? 'liked' : 'unliked' }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", action: null }
  }
}

// ブログの「いいね」状態を取得
export const getBlogLikeStatus = async ({ blogId, userId }: ToggleLikeProps) => {
  try {
    if (!blogId) return { error: "blogId is required", isLiked: false }
    if (!userId) return { error: "userId is required", isLiked: false }
    const supabase = createClient()

    // いいねの存在確認
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116は「結果が見つからない」エラー
      return { error: error.message, isLiked: false }
    }

    return { error: null, isLiked: !!data }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", isLiked: false }
  }
}