"use server"

import { createClient } from "@/utils/supabase/server"

interface ToggleLikeProps {
  blogId: string
  userId: string
}

// いいねの切り替え（追加/削除）
export const toggleLike = async ({ blogId, userId }: ToggleLikeProps) => {
  try {
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