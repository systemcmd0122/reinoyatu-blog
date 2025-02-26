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

    // まず、すでにいいねしているか確認
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .single()

    if (existingLike) {
      // いいねが存在する場合は削除
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id)

      if (deleteError) {
        return { error: deleteError.message, action: null }
      }

      return { error: null, action: "unliked" }
    } else {
      // いいねが存在しない場合は追加
      const { error: insertError } = await supabase
        .from("likes")
        .insert({
          blog_id: blogId,
          user_id: userId,
        })

      if (insertError) {
        return { error: insertError.message, action: null }
      }

      return { error: null, action: "liked" }
    }
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